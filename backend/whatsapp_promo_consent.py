"""Promotional WhatsApp consent tracking."""
from datetime import datetime, timezone
from database import users_collection

def set_promo_consent(email: str, consent: bool, source: str = "manual") -> bool:
    # Fail-closed: require explicit consent; withdrawal clears it.
    update = {
        "$set": {
            "whatsapp_promo_consent": consent,
            "whatsapp_promo_consent_timestamp": datetime.now(timezone.utc) if consent else None,
            "whatsapp_promo_consent_source": source if consent else None,
            "whatsapp_promo_consent_withdrawn_at": datetime.now(timezone.utc) if not consent else None,
        }
    }
    if users_collection is not None:
        result = users_collection.update_one({"email": email}, update, upsert=False)
        return result.matched_count > 0
    return False

def has_promo_consent(email: str) -> bool:
    if users_collection is None:
        return False
    user = users_collection.find_one({"email": email}, {"whatsapp_promo_consent": 1})
    return bool(user and user.get("whatsapp_promo_consent"))
