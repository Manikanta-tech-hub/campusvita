"""Phase 1.1 — atomic claims + lease recovery."""
import secrets
from datetime import datetime, timezone, timedelta
from whatsapp_notifications import whatsapp_outbox
STATES = {"pending", "processing", "retry_scheduled", "submitted", "delivered", "failed_permanent", "dead_letter"}
MAX_RETRY_COUNT = 4
LEASE_SECONDS = 60


def _lease_token():
    return secrets.token_urlsafe(16)


def claim_due_entries(limit=5):
    if whatsapp_outbox is None:
        return []
    now = datetime.now(timezone.utc)
    # Handle both new (pending/retry_scheduled) and legacy (None state or missing due fields) records.
    retryable_states = ["pending", "retry_scheduled"]
    # For legacy records without state, treat as retryable if they are not in terminal states.
    terminal_states = {"delivered", "failed_permanent", "dead_letter"}
    # Build filter that includes both explicitly retryable and legacy eligible records.
    filter_query = {
        "$and": [
            {"$or": [{"state": {"$in": retryable_states}}, {"state": None}]},
            {"$or": [{"next_attempt": {"$lte": now}}, {"next_attempt": None}]},
        ],
        "state": {"$nin": list(terminal_states)},
    }
    # Atomic claim: find eligible and claim with lease in one operation per doc.
    claimed = []
    # Use find with sort by next_attempt to claim oldest first.
    for doc in whatsapp_outbox.find(filter_query).sort("next_attempt", 1).limit(limit):
        lease = _lease_token()
        lease_expiry = now + timedelta(seconds=LEASE_SECONDS)
        # Simple claim filter: match doc id plus approximate eligible conditions.
        # Because find_one_and_update must match the exact current state, and legacy records have None,
        # we rely on the previous find loop having selected eligible docs; we just confirm the doc hasn't changed to terminal.
        current_check = whatsapp_outbox.find_one({"_id": doc["_id"], "state": {"$nin": list(terminal_states)}})
        if not current_check:
            continue
        result = whatsapp_outbox.find_one_and_update(
            {"_id": doc["_id"], "state": {"$nin": list(terminal_states)}},
            {"$set": {"state": "processing", "lease_token": lease, "lease_expiry": lease_expiry, "claimed_at": now}},
            return_document=True,
        )
        if result and result.get("lease_token") == lease:
            claimed.append(result)
    return claimed


def schedule_retry(entry, transient=False):
    retry = (entry.get("retry_count") or 0) + 1
    backoff = min(2 ** retry, 300)
    if (not transient) or retry >= MAX_RETRY_COUNT:
        state = "failed_permanent" if transient else "dead_letter"
        whatsapp_outbox.update_one({"_id": entry["_id"]}, {"$set": {"state": state, "last_error": entry.get("last_error", "max retries exceeded"), "next_attempt": None}})
    else:
        whatsapp_outbox.update_one({"_id": entry["_id"]}, {"$set": {"state": "retry_scheduled", "retry_count": retry, "next_attempt": datetime.now(timezone.utc) + timedelta(seconds=backoff + (entry.get("retry_count", 0) % 3))}})


def recover_expired_leases():
    if whatsapp_outbox is None:
        return 0
    now = datetime.now(timezone.utc)
    return whatsapp_outbox.update_many(
        {"state": "processing", "lease_expiry": {"$lt": now}},
        {"$set": {"state": "retry_scheduled", "next_attempt": now, "lease_token": None, "lease_expiry": None}}
    ).modified_count


def verify_lease(entry, token):
    return bool(entry and entry.get("lease_token") == token)


def process_claimed_entries():
    """Process claimed outbox entries: eligibility check, provider attempt, state update."""
    from whatsapp_service import send_template_message, TEST_MODE, is_configured
    from whatsapp_events import STATUS_MAP, record_notification
    claimed = claim_due_entries(limit=5)
    processed = 0
    for entry in claimed:
        token = entry.get("lease_token")
        # Verify lease is still owned; stale workers must not proceed.
        current = whatsapp_outbox.find_one({"_id": entry["_id"]}) if whatsapp_outbox else None
        if not verify_lease(current, token):
            continue
        # ELIGIBILITY / CONSENT GATE (fail-closed):
        # The schema does not include consent_whatsapp. Treated as missing.
        consent_missing = True  # Blocker: must be resolved with schema change.
        recipient_missing = not entry.get("customer_phone")
        ineligible = recipient_missing or consent_missing
        order_id = entry.get("order_id")
        status_value = entry.get("status", "Placed")
        # No consent enforced until schema updated; fail-closed prevents sends when eligibility unclear.
        template = STATUS_MAP.get(status_value)
        if not template:
            # Permanent failure: unsupported status/template.
            whatsapp_outbox.update_one(
                {"_id": entry["_id"], "lease_token": token},
                {"$set": {"state": "failed_permanent", "last_error": "unsupported template/status", "next_attempt": None, "lease_token": None, "lease_expiry": None}},
            )
            processed += 1
            continue
        # If ineligible (missing recipient or consent), treat as retryable transient rather than permanent failure until retries exhausted.
        if ineligible:
            retry = (entry.get("retry_count") or 0) + 1
            if retry >= 4:
                whatsapp_outbox.update_one(
                    {"_id": entry["_id"], "lease_token": token},
                    {"$set": {"state": "dead_letter", "last_error": "missing recipient or consent after retries", "next_attempt": None, "retry_count": retry, "lease_token": None, "lease_expiry": None}},
                )
            else:
                backoff = min(2 ** retry, 300)
                whatsapp_outbox.update_one(
                    {"_id": entry["_id"], "lease_token": token},
                    {"$set": {"state": "retry_scheduled", "retry_count": retry, "next_attempt": datetime.now(timezone.utc) + timedelta(seconds=backoff + (entry.get("retry_count", 0) % 3))}},
                )
            processed += 1
            continue
        # When eligible recipient present and consent assumed (pending schema addition), attempt delivery.
        result = send_template_message(
            to=str(entry.get("customer_phone", "")),
            template_name=template,
            language_code="en_US",
        )
        error_str = None if result else "Failed"
        # Update outbox with provider response.
        if error_str:
            # Transient failure: retry unless exhausted.
            retry = (entry.get("retry_count") or 0) + 1
            if retry >= 4:
                whatsapp_outbox.update_one(
                    {"_id": entry["_id"], "lease_token": token},
                    {"$set": {"state": "failed_permanent", "last_error": error_str, "next_attempt": None, "retry_count": retry, "lease_token": None, "lease_expiry": None}},
                )
            else:
                backoff = min(2 ** retry, 300)
                whatsapp_outbox.update_one(
                    {"_id": entry["_id"], "lease_token": token},
                    {"$set": {"state": "retry_scheduled", "last_error": error_str, "retry_count": retry, "next_attempt": datetime.now(timezone.utc) + timedelta(seconds=backoff + (entry.get("retry_count", 0) % 3))}},
                )
        else:
            # Submitted: provider accepted; delivery receipt handled separately via webhook.
            whatsapp_outbox.update_one(
                {"_id": entry["_id"], "lease_token": token},
                {"$set": {"state": "submitted", "provider_message_id": result.get("messages", [{}])[0].get("id") if result else None, "last_error": None, "notification_state": "sent", "next_attempt": None, "retry_count": entry.get("retry_count", 0), "lease_token": None, "lease_expiry": None}},
            )
        processed += 1
    return processed
