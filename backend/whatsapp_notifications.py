"""Notification tracking for WhatsApp order events."""
import os
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()
try:
    from pymongo import MongoClient
    client = MongoClient(os.getenv("MONGO_URL", "mongodb://localhost:27017"), serverSelectionTimeoutMS=5000)
    db = client.get_database(os.getenv("MONGODB_DB_NAME", "campusvita"))
    whatsapp_notifications = db.get_collection("whatsapp_notifications")
    rating_tokens = db.get_collection("rating_tokens")
except Exception:
    # Fallback for environments without MongoDB running (tests without DB)
    whatsapp_notifications = None
    rating_tokens = None

TEMPLATES = {
    "confirmation": "campusvita_order_confirmation",
    "accepted": "campusvita_order_accepted",
    "rating": "campusvita_order_completed_rating",
}
