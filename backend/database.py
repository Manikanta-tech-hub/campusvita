import os

from dotenv import load_dotenv
from pymongo import MongoClient, ASCENDING, DESCENDING

load_dotenv()

# =====================================
# MONGODB CONNECTION
# =====================================

MONGO_URL = os.getenv("MONGO_URL")

if not MONGO_URL:
    raise RuntimeError("MONGO_URL is not configured")

client = MongoClient(MONGO_URL)

db = client["campusvita"]

# =====================================
# COLLECTIONS
# =====================================

users_collection = db["users"]

orders_collection = db["orders"]

ratings_collection = db["ratings"]

foods_collection = db["foods"]
categories_collection = db["categories"]
payments_collection = db["payments"]
refunds_collection = db["refunds"]
counters_collection = db["counters"]
stalls_collection = db["stalls"]