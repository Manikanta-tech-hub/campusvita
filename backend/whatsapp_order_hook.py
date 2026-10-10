"""Integration hook to call WhatsApp notifications from existing order updates.
Usage: import this module in the FastAPI routes where stall_orders status changes,
and call notify_order_after_status_update(order, new_status) after the DB save succeeds.
"""
from whatsapp_events import notify_order_status

def notify_order_after_status_update(order: dict, status_value: str):
    # Extract customer phone from order; normalize to international format
    phone = order.get("customer_phone") or order.get("phone") or order.get("customerPhone")
    if not phone:
        return False
    # Basic normalization: ensure starts with +
    if isinstance(phone, str) and not phone.startswith("+"):
        phone = "+" + phone.lstrip("0")
    return notify_order_status(order, status_value, phone)
