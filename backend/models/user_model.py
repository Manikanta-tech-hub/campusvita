from database import users_collection

# =====================================
# CREATE USER DOCUMENT
# =====================================

def create_user_document(
    name,
    email,
    password,
    phone="",
    department="",
    year=""
):

    return {

        "name": name,

        "email": email,

        "password": password,

        "phone": phone,

        "department": department,

        "year": year,

        "profile_image": "",

        "wallet_balance": 0,

        "wallet_history": [],

        "favorite_foods": [],

        "notifications": True,

        "theme": "dark",

        "security": True,

        "total_orders": 0,

        "total_spent": 0,
    }