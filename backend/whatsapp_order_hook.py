"""Integration hook to call WhatsApp notifications from existing order updates.
Usage: import this module in the FastAPI routes where stall_orders status changes,
and call notify_order_after_status_update(order, new_status) after the DB save succeeds.
NOTE: The current application schema does not include an explicit customer consent field
for WhatsApp messaging. This hook fails closed: it requires a valid customer_phone from
customer_phone, phone, or customerPhone fields. Until consent data is added to the schema,
this hook relies solely on the presence of a phone number as a proxy for eligibility.
Full consent compliance requires adding a consent field (e.g., consent_whatsapp) to the order
or user model and checking it before sending.
"""
from whatsapp_events import notify_order_status

def notify_order_after_status_update(order: dict, status_value: str):
    # Fail-closed eligibility: must have a non-empty customer phone.
    # Consent data is not present in current schema; this is a production blocker.
    phone = order.get("customer_phone") or order.get("phone") or order.get("customerPhone")
    if not phone or not isinstance(phone, str) or not phone.strip():
        return False
    # Normalization: only prepend + if the number does not already start with one.
    # Do not invent international codes; assume source provides country code or full number.
    cleaned = phone.strip()
    if not cleaned.startswith("+"):
        # Basic normalization: prepend + and remove leading zero only if present.
        # This is a minimal safe normalization, not full E.164 validation.
        cleaned = "+" + cleaned.lstrip("0")
    return notify_order_status(order, status_value, cleaned)
