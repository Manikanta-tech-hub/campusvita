"""Webhook endpoint handler for Meta WhatsApp (GET verification + POST delivery updates)."""
from datetime import datetime, timezone
from fastapi import Request, HTTPException
from whatsapp_webhook import verify_signature, VERIFY_TOKEN

from whatsapp_notifications import whatsapp_notifications, whatsapp_outbox

def _extract_status_updates(payload):
    # Use official WhatsApp Cloud API status payload: entry[0].changes[0].value.statuses
    updates = []
    try:
        entry = payload.get("entry", [{}])[0]
        changes = entry.get("changes", [{}])[0]
        value = changes.get("value", {})
        for s in value.get("statuses", []):
            updates.append({
                "message_id": s.get("id"),
                "recipient_id": s.get("recipient_id"),
                "status": s.get("status"),
                "timestamp": s.get("timestamp"),
                "conversation": value.get("metadata", {}).get("conversation", {}),
            })
    except Exception:
        pass
    return updates


async def webhook_endpoint(request: Request):
    # Meta requires GET for webhook verification
    verify_token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")
    if verify_token is not None:
        if verify_token == VERIFY_TOKEN:
            return int(challenge) if challenge else 200
        raise HTTPException(status_code=403, detail="Verification failed")
    # POST for delivery updates
    body = await request.body()
    sig = request.headers.get("x-hub-signature-256", "")
    if verify_signature(body, sig):
        try:
            payload = await request.json()
        except Exception:
            payload = {}
        updates = _extract_status_updates(payload)
        # Process idempotently; never claim delivered from API acceptance alone.
        # Status mapping: submitted = API accepted; delivered requires provider delivery event separately.
        # Here we only record provider-reported status without asserting delivery.
        for u in updates:
            msg_id = u.get("message_id")
            provider_status = u.get("status")
            if msg_id and whatsapp_notifications is not None:
                # Avoid duplicate receipt by checking existing provider message ID.
                existing = whatsapp_notifications.find_one({"provider_message_id": msg_id})
                if not existing:
                    try:
                        whatsapp_notifications.insert_one({
                            "provider_message_id": msg_id,
                            "provider_status": provider_status,
                            "timestamp": datetime.now(timezone.utc),
                            "test_mode": True,
                        })
                    except Exception:
                        pass
        return {"status": "received", "verified": True, "updates_processed": len(updates)}
    return {"status": "received", "verified": False, "mode": "test_or_setup"}
