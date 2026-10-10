"""WhatsApp event connection using existing StallOrderStatus values with durable outbox."""
from typing import Optional
from dotenv import load_dotenv
load_dotenv()
from whatsapp_service import send_template_message, TEST_MODE, is_configured
from whatsapp_notifications import TEMPLATES, whatsapp_notifications, whatsapp_outbox
from datetime import datetime, timezone
import logging
from pymongo.errors import DuplicateKeyError

logger = logging.getLogger(__name__)

STATUS_MAP = {
    "Placed": TEMPLATES["confirmation"],
    "Accepted": TEMPLATES["accepted"],
    "Ready For Pickup": TEMPLATES["rating"],
    "Completed": TEMPLATES["rating"],
}


def record_notification(order_id: str, status: str, provider_id: Optional[str] = None, error: Optional[str] = None, retry_count: int = 0):
    # Durable outbox entry for recovery after restart
    outbox_entry = {
        "order_id": str(order_id),
        "status": status,
        "provider_message_id": provider_id,
        "sent_at": datetime.now(timezone.utc),
        "error": error,
        "test_mode": TEST_MODE,
        "retry_count": retry_count,
        "notification_state": "sent" if not error else "failed",
    }
    if whatsapp_outbox is not None:
        try:
            whatsapp_outbox.insert_one(outbox_entry)
        except DuplicateKeyError:
            logger.info("[WhatsApp] Duplicate outbox entry suppressed for %s / %s", order_id, status)
    # Also keep notifications collection (duplicate-protected index)
    try:
        whatsapp_notifications.insert_one({
            "order_id": str(order_id),
            "status": status,
            "provider_message_id": provider_id,
            "sent_at": datetime.now(timezone.utc),
            "error": error,
            "test_mode": TEST_MODE,
        })
    except DuplicateKeyError:
        pass  # duplicate prevented safely


def notify_order_status(order: dict, status_value: str, phone: Optional[str] = None) -> bool:
    if not phone:
        return False
    # Duplicate prevention using DB index
    existing = None
    if whatsapp_notifications is not None:
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
    error_str = None if result else "Failed"
    record_notification(
        order_id=str(order.get("_id") or order.get("token")),
        status=status_value,
        provider_id=result.get("messages", [{}])[0].get("id") if result else None,
        error=error_str,
    )
    return bool(result)
