"""WhatsApp event connection using existing StallOrderStatus values."""
from typing import Optional
from whatsapp_service import send_template_message, TEST_MODE, is_configured
from whatsapp_notifications import TEMPLATES, whatsapp_notifications
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

# Existing status mappings from backend
STATUS_MAP = {
    "Placed": TEMPLATES["confirmation"],
    "Accepted": TEMPLATES["accepted"],
    "Ready For Pickup": TEMPLATES["rating"],
    "Completed": TEMPLATES["rating"],
}


def record_notification(order_id: str, status: str, provider_id: Optional[str] = None, error: Optional[str] = None):
    whatsapp_notifications.insert_one({
        "order_id": str(order_id),
        "status": status,
        "provider_message_id": provider_id,
        "sent_at": datetime.now(timezone.utc),
        "error": error,
        "test_mode": TEST_MODE,
    })


def notify_order_status(order: dict, status_value: str, phone: Optional[str] = None) -> bool:
    if not phone:
        return False
    # Prevent duplicates for same order + status (works in test mode too)
    existing = whatsapp_notifications.find_one({
        "order_id": str(order.get("_id") or order.get("token")),
        "status": status_value,
        "error": None,
    })
    if existing:
        logger.info("[WhatsApp] Duplicate notification suppressed for order %s status %s", order.get("_id") or order.get("token"), status_value)
        return False
    template = STATUS_MAP.get(status_value)
    if not template:
        return False
    result = send_template_message(
        to=phone,
        template_name=template,
        language_code="en_US",
    )
    record_notification(
        order_id=str(order.get("_id") or order.get("token")),
        status=status_value,
        provider_id=result.get("messages", [{}])[0].get("id") if result else None,
        error=None if result else "Failed",
    )
    return bool(result)
