"""Health/config check for WhatsApp service (no secrets exposed)."""
from whatsapp_service import is_configured, TEST_MODE

def health_check() -> dict:
    return {
        "whatsapp_configured": is_configured(),
        "test_mode": TEST_MODE,
        "api_version": "v18.0",
    }
