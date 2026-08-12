from pymongo import MongoClient, ASCENDING, DESCENDING

# =====================================
# MONGODB CONNECTION
# =====================================

MONGO_URL = "mongodb://127.0.0.1:27017"

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
counters_collection = db["counters"]