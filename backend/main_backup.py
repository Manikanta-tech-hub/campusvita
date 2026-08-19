# =====================================
# IMPORTS
# =====================================

import os
import time
import random
import asyncio
import threading

from datetime import datetime
from typing import List

import socketio
import cloudinary
import cloudinary.uploader
import razorpay
from pydantic import BaseModel
from dotenv import load_dotenv

from fastapi import (
    FastAPI,
    UploadFile,
    File,
)

from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from pydantic import BaseModel, EmailStr

from firebase_admin import messaging
import firebase_config

from database import (
    users_collection,
    orders_collection,
    ratings_collection,
    foods_collection,
    payments_collection,
)
load_dotenv()
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")
print("KEY:", RAZORPAY_KEY_ID)
print("SECRET EXISTS:", RAZORPAY_KEY_SECRET is not None)
print("SECRET LENGTH:", len(RAZORPAY_KEY_SECRET) if RAZORPAY_KEY_SECRET else 0)

razorpay_client = razorpay.Client(
    auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)
)
# =====================================
# CLOUDINARY CONFIG
# =====================================

cloudinary.config(
    cloud_name="campusvita",
    api_key="235163517193758",
    api_secret="F5z4MazEs9o_rFFX2c0RZj2ZvuQ",
    secure=True
)
# =====================================
# SOCKET SERVER
# =====================================

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*"
)

# =====================================
# FASTAPI APP
# =====================================

fastapi_app = FastAPI()

# =====================================
# CORS
# =====================================

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================
# MODELS
# =====================================

class SignupData(BaseModel):

    name: str
    email: EmailStr
    password: str

    phone: str = ""
    department: str = ""
    year: str = ""


class LoginData(BaseModel):

    email: EmailStr
    password: str


# =====================================
# ORDER ITEM MODEL
# =====================================

class OrderItem(BaseModel):

    name: str
    price: float
    quantity: int
    image: str | None = None


# =====================================
# ORDER MODEL
# =====================================

class OrderData(BaseModel):

    items: List[OrderItem]
    total: float
    email: str


class RatingData(BaseModel):

    food_name: str
    rating: int
    feedback: str


class FoodData(BaseModel):

    name: str
    price: float
    category: str
    image: str


class ProfileData(BaseModel):

    name: str
    phone: str
    department: str
    year: str

    profile_image: str

    notifications: bool
    theme: str

    favorite_foods: list = []

    total_orders: int = 0
    total_spent: float = 0

    wallet: float = 0


class WalletData(BaseModel):

    email: str
    amount: float
    reason: str

# =====================================
# PAYMENT MODEL
# =====================================

class PaymentData(BaseModel):
    amount: float
class SavePaymentData(BaseModel):

    email: str

    order_id: str

    payment_id: str

    amount: float

    status: str

class VerifyPaymentData(BaseModel):

    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str

    items: list
    total: float
    email: str

    name: str
    phone: str
    location: str
# =====================================
# HOME ROUTE
# =====================================

@fastapi_app.get("/")
def home():

    return {
        "message": "CampusVita Backend Running 🚀"
    }


# =====================================
# SIGNUP
# =====================================

@fastapi_app.post("/signup")
def signup(user: SignupData):

    existing_user = users_collection.find_one({
        "email": user.email
    })

    if existing_user:

        return {
            "message": "User Already Exists"
        }

    new_user = {

        "name": user.name,
        "email": user.email,
        "password": user.password,

        "phone": user.phone,
        "department": user.department,
        "year": user.year,

        "profile_image": "",

        "wallet": 0,

        "wallet_history": [],

        "favorite_foods": [],

        "notifications": True,

        "theme": "dark",

        "total_orders": 0,
        "total_spent": 0,
    }

    users_collection.insert_one(new_user)

    return {
        "message": "Signup Successful 🚀"
    }


# =====================================
# LOGIN
# =====================================

@fastapi_app.post("/login")
def login(user: LoginData):

    existing_user = users_collection.find_one({
        "email": user.email,
        "password": user.password
    })

    if not existing_user:
        return {
            "message": "Invalid Email or Password"
        }

    return {
        "message": "Login Successful 🚀",

        "user": {
            "name": existing_user["name"],
            "email": existing_user["email"],
            "phone": existing_user.get("phone", ""),
            "department": existing_user.get("department", ""),
            "year": existing_user.get("year", ""),
            "wallet": existing_user.get("wallet", 0),
            "role": existing_user.get("role", "USER")
        }
    }
    return {
        "message": "Invalid Email or Password"
    }
# =====================================
# GET PROFILE
# =====================================

@fastapi_app.get("/profile/{email}")
def get_profile(email: str):

    user = users_collection.find_one(
        {"email": email},
        {"_id": 0, "password": 0}
    )

    if not user:

        return {
            "message": "User Not Found"
        }

    return {

        "name":
        user.get("name", ""),

        "email":
        user.get("email", ""),

        "phone":
        user.get("phone", ""),

        "department":
        user.get("department", ""),

        "year":
        user.get("year", ""),

        "profile_image":
        user.get("profile_image", ""),

        "wallet":
        user.get("wallet", 0),

        "wallet_history":
        user.get("wallet_history", []),

        "favorite_foods":
        user.get("favorite_foods", []),

        "total_orders":
        user.get("total_orders", 0),

        "total_spent":
        user.get("total_spent", 0),

        "notifications":
        user.get("notifications", True),

        "theme":
        user.get("theme", "dark")
    }


# =====================================
# UPDATE PROFILE
# =====================================

@fastapi_app.put("/update-profile/{email}")
def update_profile(
    email: str,
    profile: ProfileData
):

    users_collection.update_one(

        {"email": email},

        {
            "$set": {

                "name":
                profile.name,

                "phone":
                profile.phone,

                "department":
                profile.department,

                "year":
                profile.year,

                "profile_image":
                profile.profile_image,

                "notifications":
                profile.notifications,

                "theme":
                profile.theme,
            }
        }
    )

    return {
        "message":
        "Profile Updated Successfully 🚀"
    }


# =====================================
# WALLET SYSTEM
# =====================================

@fastapi_app.post("/wallet/add-money")
def add_money(data: WalletData):

    users_collection.update_one(
        {"email": data.email},
        {
            "$inc": {
                "wallet": data.amount
            },

            "$push": {
                "wallet_history": {

                    "type": "credit",

                    "amount": data.amount,

                    "reason": data.reason,

                    "date":
                    datetime.now().strftime(
                        "%d %b %Y, %I:%M %p"
                    )
                }
            }
        }
    )

    return {
        "message": "Money Added Successfully 🚀"
    }


# =====================================
# SOCKET EMIT
# =====================================

def emit_order_update(order_data):

    asyncio.run(
        sio.emit(
            "order_update",
            order_data
        )
    )


# =====================================
# AUTO ORDER STATUS FLOW
# =====================================

def update_order_flow(order_id):

    statuses = [
        "Cooking",
        "Ready For Pickup",
        "Completed"
    ]

    for status in statuses:

        time.sleep(10)

        orders_collection.update_one(
            {"_id": order_id},
            {
                "$set": {
                    "status": status
                }
            }
        )

        updated_order = orders_collection.find_one(
            {"_id": order_id},
            {"_id": 0}
        )

        emit_order_update(updated_order)


# =====================================
# PLACE ORDER
# =====================================

@fastapi_app.post("/place-order")
async def place_order(order: OrderData):

    try:

        order_dict = order.dict()

        # SAVE USER EMAIL

        order_dict["email"] = order.email

        total_orders = orders_collection.count_documents({})

        order_dict["token"] = total_orders + 1

        order_dict["status"] = "Preparing"

        order_dict["date"] = datetime.now().strftime(
            "%d %b %Y, %I:%M %p"
        )

        order_dict["estimated_time"] = "15-20 mins"

        order_dict["pickup_code"] = random.randint(
            1000,
            9999
        )

        # SAVE ORDER

        result = orders_collection.insert_one(
            order_dict
        )

        # FETCH SAVED ORDER

        saved_order = orders_collection.find_one(
            {"_id": result.inserted_id},
            {"_id": 0}
        )

        # SOCKET EMIT

        await sio.emit(
            "order_update",
            saved_order
        )

        # AUTO STATUS THREAD

        threading.Thread(
            target=update_order_flow,
            args=(result.inserted_id,),
            daemon=True
        ).start()

        return {
            "success": True,
            "message": "Order Placed Successfully 🚀",
            "order": saved_order
        }

    except Exception as e:

        print("PLACE ORDER ERROR:", e)

        return {
            "success": False,
            "message": str(e)
        }


# =====================================
# GET ORDERS
# =====================================

from bson import ObjectId

@fastapi_app.get("/orders/{email}")
def get_orders(email: str):

    orders = list(
        orders_collection.find({"email": email})
    )

    for order in orders:
        order["order_id"] = str(order["_id"])
        del order["_id"]

    return {
        "orders": orders
    }


# =====================================
# UPDATE ORDER STATUS
# =====================================

@fastapi_app.put("/update-order-status/{order_id}")
def update_order_status(
    order_id: str,
    status: str
):

    result = orders_collection.update_one(
        {"_id": ObjectId(order_id)},
        {
            "$set": {
                "status": status
            }
        }
    )

    if result.matched_count == 0:

        return {
            "message": "Order Not Found"
        }

    updated_order = orders_collection.find_one(
        {"_id": ObjectId(order_id)}
    )

    updated_order["order_id"] = str(updated_order["_id"])
    del updated_order["_id"]

    emit_order_update(updated_order)

    return {
        "message": "Order Status Updated 🚀"
    }
# =====================================
# RATE ORDER
# =====================================

@fastapi_app.post("/rate-order")
def rate_order(rating: RatingData):

    ratings_collection.insert_one(
        rating.dict()
    )

    return {
        "message": "Rating Saved ⭐"
    }


# =====================================
# DELETE ORDER
# =====================================

from bson import ObjectId

@fastapi_app.delete("/delete-order/{order_id}")
def delete_order(order_id: str):

    result = orders_collection.delete_one(
        {"_id": ObjectId(order_id)}
    )

    if result.deleted_count == 0:
        return {
            "message": "Order Not Found"
        }

    return {
        "message": "Order Deleted Successfully 🗑️"
    }

# =====================================
# ADD FOOD
# =====================================

@fastapi_app.post("/add-food")
def add_food(food: FoodData):

    foods_collection.insert_one(
        food.dict()
    )

    return {
        "message": "Food Added Successfully 🍔"
    }


# =====================================
# GET FOODS
# =====================================

@fastapi_app.get("/foods")
def get_foods():

    foods = list(
        foods_collection.find({}, {"_id": 0})
    )

    return {
        "foods": foods
    }


# =====================================
# UPDATE FOOD
# =====================================

@fastapi_app.put("/update-food/{food_name}")
def update_food(
    food_name: str,
    food: FoodData
):

    foods_collection.update_one(
        {"name": food_name},
        {
            "$set": food.dict()
        }
    )

    return {
        "message": "Food Updated Successfully ✏️"
    }


# =====================================
# DELETE FOOD
# =====================================

@fastapi_app.delete("/delete-food/{food_name}")
def delete_food(food_name: str):

    foods_collection.delete_one({
        "name": food_name
    })

    return {
        "message": "Food Deleted Successfully 🗑️"
    }


# =====================================
# IMAGE UPLOAD
# =====================================

@fastapi_app.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...)
):

    try:

        result = cloudinary.uploader.upload(
            file.file
        )

        return {
            "image_url": result["secure_url"]
        }

    except Exception as e:

        return {
            "message": "Upload Failed",
            "error": str(e)
        }


# =====================================
# TEST NOTIFICATION
# =====================================

@fastapi_app.get("/send-test-notification")
def send_test_notification():

    message = messaging.Message(

        notification=messaging.Notification(
            title="CampusVita",
            body="Test notification working 🚀",
        ),

        token="YOUR_FCM_TOKEN_HERE",
    )

    response = messaging.send(message)

    return {
        "success": True,
        "response": response,
    }


# =====================================
# STATIC FILES
# =====================================

if not os.path.exists("uploads"):

    os.makedirs("uploads")

fastapi_app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads"
)

# =====================================
# CREATE RAZORPAY PAYMENT ORDER
# =====================================

@fastapi_app.post("/create-razorpay-order")
def create_payment_order(payment: PaymentData):

    try:

        amount = int(payment.amount * 100)  # Convert ₹ to paise

        razorpay_order = razorpay_client.order.create({

            "amount": amount,

            "currency": "INR",

            "payment_capture": 1

        })

        return {

            "success": True,

            "order_id": razorpay_order["id"],

            "amount": razorpay_order["amount"],

            "currency": razorpay_order["currency"],

            "key": RAZORPAY_KEY_ID

        }

    except Exception as e:

        return {

            "success": False,

            "message": str(e)

        }
# =====================================
# VERIFY PAYMENT
# =====================================

@fastapi_app.post("/verify-payment")
async def verify_payment(data: VerifyPaymentData):

    try:

        # Verify Razorpay Signature
        razorpay_client.utility.verify_payment_signature({
            "razorpay_order_id": data.razorpay_order_id,
            "razorpay_payment_id": data.razorpay_payment_id,
            "razorpay_signature": data.razorpay_signature,
        })

        # Create Order
        order = {
            "items": data.items,
            "total": data.total,
            "email": data.email,

            "name": data.name,
            "phone": data.phone,

            "payment_method": "ONLINE",
            "payment_status": "Paid",

            "payment_id": data.razorpay_payment_id,
            "razorpay_order_id": data.razorpay_order_id,
            "payment_date": datetime.now().strftime("%d %b %Y, %I:%M %p"),
            "payment_amount": data.total,
            "status": "Preparing",

            "date": datetime.now().strftime("%d %b %Y, %I:%M %p"),

            "estimated_time": "15-20 mins",

            "pickup_code": random.randint(1000, 9999),

            "token": orders_collection.count_documents({}) + 1,
        }

        result = orders_collection.insert_one(order)

        saved_order = orders_collection.find_one(
            {"_id": result.inserted_id},
            {"_id": 0}
        )
         # ✅ UPDATE USER STATISTICS
        users_collection.update_one(
            {"email": data.email},
            {
                "$inc": {
                    "total_orders": 1,
                    "total_spent": data.total
                }
            }
        )
        # ✅ FIX: Indent these lines properly (4 spaces inside try block)
        payment = {
            "email": data.email,
            "payment_id": data.razorpay_payment_id,
            "order_id": data.razorpay_order_id,
            "amount": data.total,
            "status": "Paid",
            "date": datetime.now().strftime("%d %b %Y, %I:%M %p")
        }

        payments_collection.insert_one(payment)

        await sio.emit(
            "order_update",
            saved_order
        )

        threading.Thread(
            target=update_order_flow,
            args=(result.inserted_id,),
            daemon=True
        ).start()

        return {
           "success": True,
           "message": "Payment Verified Successfully",
           "payment_id": data.razorpay_payment_id,
           "order": saved_order,
}

    except Exception as e:

        print("VERIFY PAYMENT ERROR:", e)

        return {
            "success": False,
            "message": str(e),
        }
# =====================================
# SAVE PAYMENT
# =====================================

@fastapi_app.post("/save-payment")
def save_payment(payment: SavePaymentData):

    try:

        payment_data = {

            "email": payment.email,

            "order_id": payment.order_id,

            "payment_id": payment.payment_id,

            "amount": payment.amount,

            "status": payment.status,

            "date": datetime.now().strftime(
                "%d %b %Y, %I:%M %p"
            )

        }

        payments_collection.insert_one(payment_data)

        return {

            "success": True,

            "message": "Payment Saved Successfully"

        }

    except Exception as e:

        return {

            "success": False,

            "message": str(e)

        }
# =====================================
# ADMIN ORDERS
# =====================================

@fastapi_app.get("/admin/orders")
def get_admin_orders():
    try:
        orders = list(orders_collection.find())

        for order in orders:
            order["_id"] = str(order["_id"])

        return orders

    except Exception as e:
        print("ADMIN ORDERS ERROR:", e)
        return []
    
from pydantic import BaseModel

class StatusUpdate(BaseModel):
    status: str

# =====================================
# ADMIN ORDERS - UPDATE STATUS 
# =====================================

@fastapi_app.put("/admin/orders/{token}")
def update_order_status(token: int, data: StatusUpdate):
    result = orders_collection.update_one(
        {"token": token},
        {"$set": {"status": data.status}}
    )

    if result.modified_count:
        return {
            "success": True,
            "message": "Status updated"
        }

    return {
        "success": False,
        "message": "Order not found"
    }
# =====================================
# GET SINGLE ORDER BY TOKEN
# =====================================

@fastapi_app.get("/track-order/{token}")
def get_order_by_token(token: int):
    order = orders_collection.find_one({"token": token})

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order["_id"] = str(order["_id"])
    return order
# =====================================
# ADMIN DASHBOARD
# =====================================

@fastapi_app.get("/admin/dashboard")
def admin_dashboard():
    try:
        # Total orders
        total_orders = orders_collection.count_documents({})

        # Completed orders
        completed_orders = orders_collection.count_documents({
            "status": "Completed"
        })

        # Pending orders
        pending_orders = orders_collection.count_documents({
            "status": {
                "$in": ["Preparing", "Processing", "Pending"]
            }
        })

        # Revenue
        pipeline = [
            {
                "$group": {
                    "_id": None,
                    "total": {
                        "$sum": "$total"
                    }
                }
            }
        ]

        revenue_result = list(
            orders_collection.aggregate(pipeline)
        )

        total_revenue = (
            revenue_result[0]["total"]
            if revenue_result
            else 0
        )

        return {
            "total_orders": total_orders,
            "total_revenue": total_revenue,
            "pending_orders": pending_orders,
            "completed_orders": completed_orders,
        }

    except Exception as e:
        print("ADMIN DASHBOARD ERROR:", e)

        return {
            "total_orders": 0,
            "total_revenue": 0,
            "pending_orders": 0,
            "completed_orders": 0,
        }
# =====================================
# FINAL SOCKET APP
# =====================================

app = socketio.ASGIApp(
    sio,
    fastapi_app
)