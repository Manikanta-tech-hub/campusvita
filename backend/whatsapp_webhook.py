"""WhatsApp webhook verification and delivery updates (idempotent)."""
import os
import hmac
import hashlib
from typing import Optional

VERIFY_TOKEN = os.getenv("WHATSAPP_WEBHOOK_VERIFY_TOKEN", "placeholder_verify_token")
APP_SECRET = os.getenv("WHATSAPP_APP_SECRET", "")


def verify_signature(request_body: bytes, signature_header: str) -> bool:
    if not APP_SECRET or APP_SECRET == "placeholder_app_secret":
        return False
    expected = "sha256=" + hmac.new(
        APP_SECRET.encode(), request_body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(str(expected), str(signature_header))
