"""Rating URL generation with server-side token storage and validation."""
import secrets
from datetime import datetime, timezone, timedelta
from whatsapp_notifications import rating_tokens, db

def generate_rating_url(order_id: str, item_index: int, expires_hours: int = 72) -> str:
    token = secrets.token_urlsafe(32)
    expiry = datetime.now(timezone.utc) + timedelta(hours=expires_hours)
    if rating_tokens is not None:
        rating_tokens.insert_one({
            "token": token,
            "order_id": str(order_id),
            "item_index": item_index,
            "expires_at": expiry,
            "used": False,
            "created_at": datetime.now(timezone.utc),
        })
    return f"/rating/{order_id}?item={item_index}&token={token}"


def validate_rating_token(token: str) -> dict:
    if rating_tokens is None:
        return {"valid": False, "reason": "no_db"}
    record = rating_tokens.find_one({"token": token})
    if not record:
        return {"valid": False, "reason": "token_not_found"}
    if record.get("used"):
        return {"valid": False, "reason": "already_used"}
    now = datetime.now(timezone.utc)
    exp = record.get("expires_at")
    if exp and exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp and exp < now:
        return {"valid": False, "reason": "expired"}
    return {"valid": True, "order_id": record.get("order_id"), "item_index": record.get("item_index"), "record": record}


def consume_rating_token(token: str) -> bool:
    if rating_tokens is None:
        return False
    result = rating_tokens.update_one(
        {"token": token, "used": False, "expires_at": {"$gt": datetime.now(timezone.utc)}},
        {"$set": {"used": True, "used_at": datetime.now(timezone.utc)}}
    )
    return result.modified_count == 1
