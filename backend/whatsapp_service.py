"""WhatsApp Cloud API service for CampusVita."""
import os
import logging
from typing import Optional, Dict, Any
import requests
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

TEST_MODE = str(os.getenv("WHATSAPP_TEST_MODE", "false")).lower() == "true"
ACCESS_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
BUSINESS_ACCOUNT_ID = os.getenv("WHATSAPP_BUSINESS_ACCOUNT_ID", "")
API_VERSION = os.getenv("WHATSAPP_API_VERSION", "v18.0")
APP_SECRET = os.getenv("WHATSAPP_APP_SECRET", "")

BASE_URL = f"https://graph.facebook.com/{API_VERSION}/{PHONE_NUMBER_ID}"


def is_configured() -> bool:
    return bool(ACCESS_TOKEN and PHONE_NUMBER_ID and PHONE_NUMBER_ID != "placeholder_phone_id")


def send_template_message(
    to: str,
    template_name: str,
    language_code: str = "en_US",
    components: Optional[list] = None,
) -> Optional[Dict]:
    if TEST_MODE:
        logger.info("[WhatsApp TEST MODE] Would send template %s to %s", template_name, to)
        return {"messages": [{"id": "test_message_id"}], "test": True}
    if not is_configured():
        logger.warning("[WhatsApp] Not configured; skipping message to %s", to)
        return None
    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": language_code},
            "components": components or [],
        },
    }
    headers = {
        "Authorization": f"Bearer {ACCESS_TOKEN}",
        "Content-Type": "application/json",
    }
    try:
        resp = requests.post(f"{BASE_URL}/messages", headers=headers, json=payload, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        logger.info("[WhatsApp] Sent %s to %s; id=%s", template_name, to, data.get("messages", [{}])[0].get("id"))
        return data
    except Exception as e:
        logger.error("[WhatsApp] Failed to send to %s: %s", to, e)
        return None
