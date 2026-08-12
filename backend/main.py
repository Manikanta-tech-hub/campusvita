# =====================================
# IMPORTS
# =====================================
from websocket_manager import manager
import os
import re
import time
import random
import asyncio
import threading
import logging
import hmac
import hashlib
import bcrypt
import jwt


from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from contextlib import asynccontextmanager

import socketio
import cloudinary
import cloudinary.uploader
import razorpay
from typing import Dict, Any
from bson import ObjectId
from bson.errors import InvalidId
from pymongo.errors import DuplicateKeyError
from pydantic import BaseModel, EmailStr, Field, validator
from dotenv import load_dotenv
from pymongo import ASCENDING, DESCENDING
from fastapi import (
    FastAPI,
    UploadFile,
    File,
    Form,
    HTTPException,
    status,
    Depends,
    Header,
    Request,
    Query,
    WebSocket, WebSocketDisconnect
)
from utils.file_upload import save_food_image
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from firebase_admin import messaging
import firebase_config

from database import (
    users_collection,
    orders_collection,
    ratings_collection,
    foods_collection,
    payments_collection,
    counters_collection,
    categories_collection,
)

load_dotenv()

# =====================================
# LOGGING CONFIGURATION
# =====================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# =====================================
# ENVIRONMENT VARIABLES VALIDATION
# =====================================

def get_env_or_raise(key: str) -> str:
    value = os.getenv(key)
    if not value:
        raise ValueError(f"Missing required environment variable: {key}")
    return value


RAZORPAY_KEY_ID = get_env_or_raise("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = get_env_or_raise("RAZORPAY_KEY_SECRET")
CLOUDINARY_CLOUD_NAME = get_env_or_raise("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = get_env_or_raise("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = get_env_or_raise("CLOUDINARY_API_SECRET")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
JWT_SECRET = get_env_or_raise("JWT_SECRET")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))
ORDER_INTENT_EXPIRE_MINUTES = int(os.getenv("ORDER_INTENT_EXPIRE_MINUTES", 30))
FCM_TOKEN = os.getenv("FCM_TOKEN", "")
ADMIN_EMAILS = [e.strip().lower() for e in os.getenv("ADMIN_EMAILS", "admin@campusvita.com").split(",")]

# =====================================
# CONSTANTS
# =====================================

class OrderStatus:
    PREPARING = "Preparing"
    COOKING = "Cooking"
    READY_FOR_PICKUP = "Ready For Pickup"
    COMPLETED = "Completed"

    @classmethod
    def all_statuses(cls):
        return [cls.PREPARING, cls.COOKING, cls.READY_FOR_PICKUP, cls.COMPLETED]


class PaymentStatus:
    PENDING = "Pending"
    PAID = "Paid"
    FAILED = "Failed"


class UserRole:
    ADMIN = "ADMIN"
    USER = "USER"


ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
    "image/gif",
]

ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"]
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

# =====================================
# RAZORPAY CONFIG
# =====================================

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
# Aligned with the FastAPI CORS policy below instead of a hard-coded "*".
# =====================================

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=ALLOWED_ORIGINS
)

# =====================================
# FASTAPI APP
# =====================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_indexes()
    yield


fastapi_app = FastAPI(lifespan=lifespan)

# =====================================
# CORS
# =====================================

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================
# RATE LIMITING
# Applied a sane global default, plus stricter per-route limits on the
# endpoints that are cheapest to abuse: login/signup (credential stuffing,
# account enumeration) and payment-order creation (hitting Razorpay's API).
# =====================================

limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])
fastapi_app.state.limiter = limiter
fastapi_app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
fastapi_app.add_middleware(SlowAPIMiddleware)

# =====================================
# SECURITY
# =====================================

# Required auth (raises 401/403 automatically if header missing/invalid)
security = HTTPBearer()

# Optional auth (auto_error=False) — a separate instance is required so
# get_current_user_optional actually runs when no Authorization header is
# sent. Reusing `security` (auto_error=True) would make FastAPI raise the
# 403 itself before the function body ever executes.
optional_security = HTTPBearer(auto_error=False)


# =====================================
# JWT HELPER FUNCTIONS
# =====================================

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any]) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def verify_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        print("✅ PAYLOAD:", payload)
        return payload

    except Exception as e:
        print("❌ VERIFY TOKEN ERROR:", type(e))
        print("❌ MESSAGE:", e)
        raise HTTPException(
            status_code=401,
            detail=str(e),
        )
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    token = credentials.credentials

    print("========== DEBUG ==========")
    print("TOKEN:", token)

    payload = verify_token(token)

    print("PAYLOAD:", payload)

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=401,
            detail="Invalid token type",
        )

    print("EMAIL:", payload.get("email"))

    user = users_collection.find_one({"email": payload.get("email")})

    print("USER:", user)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found",
        )

    print("===========================")

    return payload


def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security),
) -> Optional[Dict[str, Any]]:
    if credentials is None:
        return None
    try:
        return get_current_user(credentials)
    except HTTPException:
        return None


def require_role(required_role: str):
    def role_checker(current_user: Dict[str, Any] = Depends(get_current_user)):

        print("========== ROLE DEBUG ==========")
        print("Required:", required_role)
        print("Current :", current_user.get("role"))
        print("Current User:", current_user)

        if current_user.get("role").lower() != required_role.lower():
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. {required_role} role required."
            )

        return current_user

    return role_checker


# =====================================
# SIGNED "ORDER INTENT" HELPERS
# Used to carry server-computed prices/amounts from order-creation time to
# payment-verification time without trusting whatever the client resends.
# Kept separate from access/refresh JWTs (different purpose, shorter TTL,
# 400s instead of 401s since a bad intent isn't an auth failure).
# =====================================

def create_signed_intent(intent_type: str, payload: Dict[str, Any], expires_minutes: int = ORDER_INTENT_EXPIRE_MINUTES) -> str:
    to_encode = payload.copy()
    to_encode["type"] = intent_type
    to_encode["exp"] = datetime.utcnow() + timedelta(minutes=expires_minutes)
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_signed_intent(token: str, expected_type: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This order has expired, please try again",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid order reference",
        )

    if payload.get("type") != expected_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid order reference type",
        )

    return payload


# =====================================
# DATABASE INDEXES
# =====================================

async def create_indexes():
    try:
        # ============================================================
        # USERS
        # ============================================================

        users_collection.create_index(
            "email",
            unique=True
        )

        users_collection.create_index(
            "phone",
            unique=True
        )

        logger.info(
            "✅ Users collection indexes created"
        )

        # ============================================================
        # ORDERS
        # ============================================================

        orders_collection.create_index(
            "token",
            unique=True
        )

        logger.info(
            "✅ Orders collection index created"
        )

        # ============================================================
        # PAYMENTS
        # ============================================================

        payments_collection.create_index(
            "payment_id",
            unique=True
        )

        logger.info(
            "✅ Payments collection index created"
        )

        # ============================================================
        # COUNTERS
        # ============================================================

        counters_collection.create_index(
            "_id",
            unique=True
        )

        logger.info(
            "✅ Counters collection index created"
        )

    except Exception as e:
        logger.warning(
            f"⚠️ Index creation warning: {e}"
        )


# =====================================
# COUNTER HELPER
# =====================================

def get_next_token() -> int:
    result = counters_collection.find_one_and_update(
        {"_id": "order_token"},
        {"$inc": {"value": 1}},
        upsert=True,
        return_document=True
    )
    return result["value"]


# =====================================
# OBJECT ID HELPER
# =====================================

def parse_object_id(order_id: str) -> ObjectId:
    """Raises a clean 400 instead of letting InvalidId fall through to a 500."""
    try:
        return ObjectId(order_id)
    except (InvalidId, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid order id",
        )


# =====================================
# PASSWORD HELPER FUNCTIONS
# =====================================

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=int(os.getenv("BCRYPT_ROUNDS", 12)))
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def is_password_hashed(password: str) -> bool:
    return password.startswith(("$2a$", "$2b$", "$2y$"))


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8")
    )


def validate_password_strength(password: str) -> bool:
    if len(password) < 8:
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"[a-z]", password):
        return False
    if not re.search(r"\d", password):
        return False
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False
    return True


def normalize_email(email: str) -> str:
    """Emails are case-insensitive; without this, Test@x.com and test@x.com
    could end up as effectively-duplicate accounts depending on insert order."""
    return email.strip().lower()


# =====================================
# REFRESH TOKEN HASHING
# Refresh tokens are stored hashed (never in plaintext), same principle as
# passwords. bcrypt is intentionally NOT used here: bcrypt truncates its
# input at 72 bytes, and a JWT's only variable content (the timestamp) sits
# in the middle of the string — so two different valid tokens for the same
# user can share an identical first-72-byte prefix and hash the same way,
# which would let an old, already-rotated-out token still verify. Refresh
# tokens are long, high-entropy values (unlike passwords), so a fast,
# deterministic hash compared in constant time is the correct tool.
# =====================================

def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def refresh_token_matches(token: str, token_hash: Optional[str]) -> bool:
    if not token_hash:
        return False
    return hmac.compare_digest(hash_refresh_token(token), token_hash)


# =====================================
# SOCKET HELPER
# =====================================

async def safe_emit_order_update(order_data):
    asyncio.create_task(sio.emit("order_update", order_data))


def emit_order_update_sync(order_data):
    try:
        asyncio.run(sio.emit("order_update", order_data))
    except Exception as e:
        logger.error(f"Socket emit error: {e}")


# =====================================
# MODELS
# =====================================

class SignupData(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8)
    phone: str = Field(min_length=10, max_length=10)
    department: str = ""
    year: str = ""

    @validator("phone")
    def validate_phone(cls, v):
        v = v.strip()

        if not v:
            raise ValueError(
                "Phone number is required"
            )

        if not v.isdigit():
            raise ValueError(
                "Phone number must contain only digits"
            )

        if len(v) != 10:
            raise ValueError(
                "Phone number must be exactly 10 digits"
            )

        if v[0] not in "6789":
            raise ValueError(
                "Please enter a valid Indian mobile number"
            )

        return v

    @validator("password")
    def validate_password(cls, v):
        if not validate_password_strength(v):
            raise ValueError(
                "Password must contain at least 8 characters, "
                "one uppercase, one lowercase, one number, and one special character"
            )
        return v


class LoginData(BaseModel):
    email: EmailStr
    password: str


class RefreshTokenData(BaseModel):
    refresh_token: str


class ChangePasswordData(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)

    @validator("new_password")
    def validate_new_password(cls, v):
        if not validate_password_strength(v):
            raise ValueError(
                "Password must contain at least 8 characters, "
                "one uppercase, one lowercase, one number, and one special character"
            )
        return v


class OrderItemRequest(BaseModel):
    """Client only names what it wants and how many — price is never
    accepted from the client. See create_payment_order / place_order."""
    name: str = Field(min_length=1)
    quantity: int = Field(gt=0)


class OrderData(BaseModel):
    items: List[OrderItemRequest] = Field(min_length=1)


class CreateFoodOrderData(BaseModel):
    items: List[OrderItemRequest] = Field(min_length=1)
    name: str
    phone: str
    location: str


class VerifyPaymentData(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str
    order_intent: str


class RatingData(BaseModel):
    food_name: str
    rating: int = Field(ge=1, le=5)
    feedback: str = Field(max_length=500)


class FoodData(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str = Field(default="")
    price: float = Field(gt=0)
    category: str = Field(min_length=1)
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


class WalletTopupData(BaseModel):
    amount: float = Field(gt=0)


class VerifyWalletTopupData(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str
    order_intent: str


class AdminWalletAdjustData(BaseModel):
    """Manual wallet credit/debit by an admin only (e.g. refunds, goodwill
    credits). Regular users can only move money via a verified Razorpay
    payment (wallet top-up) or by spending on an order."""
    email: EmailStr
    amount: float = Field(gt=0)
    type: str
    reason: str = Field(min_length=1)

    @validator("type")
    def validate_type(cls, v):
        if v not in ("credit", "debit"):
            raise ValueError("type must be 'credit' or 'debit'")
        return v


class SavePaymentData(BaseModel):
    order_id: str
    payment_id: str
    amount: float = Field(gt=0)
    status: str


class StatusUpdate(BaseModel):
    status: str

    @validator("status")
    def validate_status(cls, v):
        if v not in OrderStatus.all_statuses():
            raise ValueError(f"Invalid status. Must be one of: {OrderStatus.all_statuses()}")
        return v


# =====================================
# HOME ROUTE
# =====================================

@fastapi_app.get("/")
def home():
    return {"message": "CampusVita Backend Running 🚀"}


# =====================================
# AUTH ROUTES
# =====================================

@fastapi_app.post("/signup")
@limiter.limit("5/minute")
def signup(request: Request, user: SignupData):
    try:
        email = normalize_email(user.email)
        phone = user.phone.strip()

        # ============================================================
        # CHECK DUPLICATE EMAIL
        # ============================================================

        existing_user = users_collection.find_one(
            {"email": email}
        )

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This email address is already registered"
            )

        # ============================================================
        # CHECK DUPLICATE PHONE
        # ============================================================

        existing_phone = users_collection.find_one(
            {"phone": phone}
        )

        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This phone number is already registered"
            )

        # ============================================================
        # HASH PASSWORD
        # ============================================================

        hashed_password = hash_password(user.password)

        # ============================================================
        # DETERMINE USER ROLE
        # ============================================================

        role = (
            UserRole.ADMIN
            if email in ADMIN_EMAILS
            else UserRole.USER
        )

        # ============================================================
        # CREATE NEW USER
        # ============================================================

        new_user = {
            "name": user.name.strip(),
            "email": email,
            "password": hashed_password,
            "phone": phone,
            "department": user.department.strip(),
            "year": user.year,
            "profile_image": "",
            "wallet": 0,
            "wallet_history": [],
            "favorite_foods": [],
            "notifications": True,
            "theme": "dark",
            "total_orders": 0,
            "total_spent": 0,
            "role": role,
            "created_at": datetime.utcnow().isoformat(),
            "is_active": True,
        }

        # ============================================================
        # SAVE USER TO DATABASE
        # ============================================================

        users_collection.insert_one(new_user)

        logger.info(
            f"✅ New user signed up: {email} (role: {role})"
        )

        # ============================================================
        # SUCCESS RESPONSE
        # ============================================================

        return {
            "message": "Signup Successful 🚀",
            "user": {
                "email": email,
                "name": user.name,
                "role": role
            }
        }

    # ================================================================
    # HANDLE EXPECTED ERRORS
    # ================================================================

    except HTTPException:
        raise

    # ================================================================
    # HANDLE UNEXPECTED ERRORS
    # ================================================================

    except Exception as e:
        logger.error(f"Signup error: {e}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error"
        )

@fastapi_app.post("/login")
@limiter.limit("5/minute")
def login(request: Request, user: LoginData):
    try:
        email = normalize_email(user.email)
        existing_user = users_collection.find_one({"email": email})

        if not existing_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        if not existing_user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated"
            )

        stored_password = existing_user["password"]

        if is_password_hashed(stored_password):
            if not verify_password(user.password, stored_password):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password"
                )
        else:
            # Temporary migration for old users
            if user.password != stored_password:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password"
                )
            hashed_password = hash_password(user.password)
            users_collection.update_one(
                {"email": email},
                {"$set": {"password": hashed_password}}
            )

        token_data = {
            "email": existing_user["email"],
            "role": existing_user.get("role", UserRole.USER),
            "name": existing_user["name"],
        }

        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        # Store only the hash of the refresh token, never the raw value.
        users_collection.update_one(
            {"email": email},
            {"$set": {"refresh_token_hash": hash_refresh_token(refresh_token)}}
        )

        logger.info(f"✅ User logged in: {email}")

        return {
            "message": "Login Successful 🚀",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "user": {
                "name": existing_user["name"],
                "email": existing_user["email"],
                "phone": existing_user.get("phone", ""),
                "department": existing_user.get("department", ""),
                "year": existing_user.get("year", ""),
                "wallet": existing_user.get("wallet", 0),
                "role": existing_user.get("role", UserRole.USER),
                "profile_image": existing_user.get("profile_image", ""),
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error"
        )


@fastapi_app.post("/refresh-token")
def refresh_token_route(data: RefreshTokenData):
    try:
        payload = verify_token(data.refresh_token)

        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )

        user = users_collection.find_one({"email": payload.get("email")})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )

        if not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated"
            )

        if not refresh_token_matches(data.refresh_token, user.get("refresh_token_hash")):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )

        token_data = {
            "email": user["email"],
            "role": user.get("role", UserRole.USER),
            "name": user["name"],
        }

        new_access_token = create_access_token(token_data)

        # Rotate the refresh token: a leaked-but-unused old token becomes
        # useless the moment the legitimate client refreshes.
        new_refresh_token = create_refresh_token(token_data)
        users_collection.update_one(
            {"email": user["email"]},
            {"$set": {"refresh_token_hash": hash_refresh_token(new_refresh_token)}}
        )

        logger.info(f"🔄 Token refreshed for: {user['email']}")

        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Refresh token error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error"
        )


@fastapi_app.post("/logout")
def logout(current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        users_collection.update_one(
            {"email": current_user["email"]},
            {"$unset": {"refresh_token_hash": ""}}
        )

        logger.info(f"👋 User logged out: {current_user['email']}")

        return {"message": "Logged out successfully"}

    except Exception as e:
        logger.error(f"Logout error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error"
        )


@fastapi_app.post("/change-password")
def change_password(data: ChangePasswordData, current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        user = users_collection.find_one({"email": current_user["email"]})

        if not verify_password(data.current_password, user["password"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )

        hashed_password = hash_password(data.new_password)

        users_collection.update_one(
            {"email": current_user["email"]},
            {"$set": {"password": hashed_password}}
        )

        logger.info(f"🔑 Password changed for: {current_user['email']}")

        return {"message": "Password changed successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Change password error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error"
        )


# =====================================
# USER ROUTES (Protected)
# =====================================

@fastapi_app.get("/profile")
def get_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        user = users_collection.find_one(
            {"email": current_user["email"]},
            {"_id": 0, "password": 0, "refresh_token_hash": 0}
        )

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        return user

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get profile error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error"
        )


@fastapi_app.put("/profile")
def update_profile(profile: ProfileData, current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        result = users_collection.update_one(
            {"email": current_user["email"]},
            {
                "$set": {
                    "name": profile.name,
                    "phone": profile.phone,
                    "department": profile.department,
                    "year": profile.year,
                    "profile_image": profile.profile_image,
                    "notifications": profile.notifications,
                    "theme": profile.theme,
                }
            }
        )

        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        logger.info(f"✅ Profile updated: {current_user['email']}")

        return {"message": "Profile Updated Successfully 🚀"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update profile error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error"
        )


@fastapi_app.get("/wallet/balance")
def get_wallet_balance(current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        user = users_collection.find_one(
            {"email": current_user["email"]},
            {"wallet": 1, "wallet_history": 1, "_id": 0}
        )

        return {
            "balance": user.get("wallet", 0),
            "history": user.get("wallet_history", [])
        }

    except Exception as e:
        logger.error(f"Get wallet balance error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error"
        )


# =====================================
# WALLET TOP-UP (Razorpay-verified — never trust a client-set balance)
# Flow: create-topup-order (server issues a signed intent tying the amount
# to a specific Razorpay order) -> user pays -> verify-topup (server checks
# the signature AND that the intent matches this exact payment) -> credit.
# =====================================

@fastapi_app.post("/wallet/create-topup-order")
@limiter.limit("10/minute")
def create_wallet_topup_order(request: Request, data: WalletTopupData, current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        amount = round(data.amount, 2)
        amount_paise = int(round(amount * 100))

        razorpay_order = razorpay_client.order.create({
            "amount": amount_paise,
            "currency": "INR",
            "payment_capture": 1
        })

        order_intent = create_signed_intent(
            "wallet_topup",
            {
                "email": current_user["email"],
                "amount": amount,
                "razorpay_order_id": razorpay_order["id"],
            },
        )

        logger.info(f"💰 Wallet top-up order created: {razorpay_order['id']} for {current_user['email']}")

        return {
            "success": True,
            "order_id": razorpay_order["id"],
            "amount": razorpay_order["amount"],
            "currency": razorpay_order["currency"],
            "key": RAZORPAY_KEY_ID,
            "order_intent": order_intent,
        }

    except Exception as e:
        logger.error(f"Create wallet topup order error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error"
        )


@fastapi_app.post("/wallet/verify-topup")
def verify_wallet_topup(data: VerifyWalletTopupData, current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        intent = decode_signed_intent(data.order_intent, "wallet_topup")

        if intent.get("razorpay_order_id") != data.razorpay_order_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Order reference does not match this payment"
            )

        if intent.get("email") != current_user["email"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This order reference belongs to a different account"
            )

        # Idempotency: a payment_id can only ever be applied once. Checked
        # here, and enforced again by the unique index + DuplicateKeyError
        # catch below in case of a concurrent double-submit race.
        if payments_collection.find_one({"payment_id": data.razorpay_payment_id}):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment already processed"
            )

        razorpay_client.utility.verify_payment_signature({
            "razorpay_order_id": data.razorpay_order_id,
            "razorpay_payment_id": data.razorpay_payment_id,
            "razorpay_signature": data.razorpay_signature,
        })

        amount = intent["amount"]

        payment = {
            "email": current_user["email"],
            "payment_id": data.razorpay_payment_id,
            "order_id": data.razorpay_order_id,
            "razorpay_signature": data.razorpay_signature,  # kept for auditing
            "amount": amount,
            "status": PaymentStatus.PAID,
            "purpose": "wallet_topup",
            "date": datetime.now().strftime("%d %b %Y, %I:%M %p"),
            "user_email": current_user["email"],
        }

        try:
            payments_collection.insert_one(payment)
        except DuplicateKeyError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment already processed"
            )

        users_collection.update_one(
            {"email": current_user["email"]},
            {
                "$inc": {"wallet": amount},
                "$push": {
                    "wallet_history": {
                        "type": "credit",
                        "amount": amount,
                        "reason": "Wallet top-up via Razorpay",
                        "payment_id": data.razorpay_payment_id,
                        "date": datetime.now().strftime("%d %b %Y, %I:%M %p"),
                    }
                },
            },
        )

        logger.info(f"✅ Wallet topped up for {current_user['email']}: +₹{amount}")

        return {
            "success": True,
            "message": "Wallet Topped Up Successfully 🚀",
            "amount_added": amount,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Verify wallet topup error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error"
        )


# =====================================
# ORDER ROUTES
# =====================================

@fastapi_app.get("/orders")
def get_orders(current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        orders = list(orders_collection.find({"email": current_user["email"]}))

        for order in orders:
            order["order_id"] = str(order["_id"])
            del order["_id"]

        return {"orders": orders}

    except Exception as e:
        logger.error(f"Get orders error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error"
        )


@fastapi_app.get("/track-order/{token}")
def get_order_by_token(token: int, current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)):
    try:
        order = orders_collection.find_one({"token": token})

        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )

        if current_user and current_user.get("role") != UserRole.ADMIN:
            if order.get("email") != current_user["email"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied"
                )

        order["order_id"] = str(order["_id"])
        del order["_id"]

        return order

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get order by token error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error"
        )


def _price_items_from_db(items: List[OrderItemRequest]) -> tuple[list, float]:
    """Looks up every item's authoritative price/image from the foods
    collection. The client only ever supplies a name + quantity — price
    is never accepted from the request body."""
    food_names = [item.name for item in items]
    foods_by_name = {f["name"]: f for f in foods_collection.find({"name": {"$in": food_names}})}

    priced_items = []
    total = 0.0

    for item in items:
        food = foods_by_name.get(item.name)
        if not food:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Food item '{item.name}' does not exist"
            )
        price = float(food["price"])
        priced_items.append({
            "name": item.name,
            "price": price,
            "quantity": item.quantity,
            "image": food.get("image", ""),
        })
        total += price * item.quantity

    return priced_items, round(total, 2)


@fastapi_app.post("/place-order")
async def place_order(order: OrderData, current_user: Dict[str, Any] = Depends(get_current_user)):
    """'Pay with Wallet' order path. Prices come from the DB, and the
    wallet balance is checked and debited atomically so two concurrent
    submissions can't both succeed and overdraw the balance."""
    try:
        order_items, total = _price_items_from_db(order.items)

        updated_user = users_collection.find_one_and_update(
            {"email": current_user["email"], "wallet": {"$gte": total}},
            {
                "$inc": {"wallet": -total},
                "$push": {
                    "wallet_history": {
                        "type": "debit",
                        "amount": total,
                        "reason": "Order payment",
                        "date": datetime.now().strftime("%d %b %Y, %I:%M %p"),
                    }
                },
            },
        )

        if updated_user is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insufficient wallet balance"
            )

        order_dict = {
            "items": order_items,
            "total": total,
            "email": current_user["email"],
            "user_email": current_user["email"],
            "token": get_next_token(),
            "status": OrderStatus.PREPARING,
            "payment_method": "WALLET",
            "payment_status": PaymentStatus.PAID,
            "date": datetime.now().strftime("%d %b %Y, %I:%M %p"),
            "estimated_time": "15-20 mins",
            "pickup_code": random.randint(1000, 9999),
        }

        result = orders_collection.insert_one(order_dict)

        saved_order = orders_collection.find_one(
            {"_id": result.inserted_id},
            {"_id": 0}
        )

        users_collection.update_one(
            {"email": current_user["email"]},
            {"$inc": {"total_orders": 1, "total_spent": total}}
        )

        await safe_emit_order_update(saved_order)

        threading.Thread(
            target=update_order_flow,
            args=(result.inserted_id,),
            daemon=True
        ).start()

        logger.info(f"✅ New wallet order placed: #{saved_order['token']} by {current_user['email']}")

        return {
            "success": True,
            "message": "Order Placed Successfully 🚀",
            "order": saved_order
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Place order error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error"
        )


@fastapi_app.put("/update-order-status/{order_id}")
async def update_order_status(
    order_id: str,
    data: StatusUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    # The body is bound to `data: StatusUpdate` (not a bare `status: str`
    # parameter) specifically so this function's local scope never shadows
    # the imported `fastapi.status` module used below.
    try:
        order = orders_collection.find_one({"_id": parse_object_id(order_id)})
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )

        if current_user.get("role") != UserRole.ADMIN:
            if order.get("email") != current_user["email"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You can only update your own orders"
                )

        orders_collection.update_one(
            {"_id": order["_id"]},
            {"$set": {"status": data.status}}
        )

        updated_order = orders_collection.find_one({"_id": order["_id"]})
        updated_order["order_id"] = str(updated_order["_id"])
        del updated_order["_id"]

        await safe_emit_order_update(updated_order)

        logger.info(f"✅ Order {order_id} status updated to {data.status}")

        return {
            "success": True,
            "message": f"Order status updated to {data.status} 🚀",
            "order": updated_order
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update order status error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error"
        )


@fastapi_app.delete("/delete-order/{order_id}")
def delete_order(order_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        order = orders_collection.find_one({"_id": parse_object_id(order_id)})
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )

        if current_user.get("role") != UserRole.ADMIN:
            if order.get("email") != current_user["email"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You can only delete your own orders"
                )

        orders_collection.delete_one({"_id": order["_id"]})

        logger.info(f"🗑️ Order deleted: {order_id} by {current_user['email']}")

        return {"message": "Order Deleted Successfully 🗑️"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete order error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error"
        )


# =====================================
# ORDER STATUS FLOW (Background Thread)
# =====================================

def update_order_flow(order_id):
    flow_statuses = [
        OrderStatus.COOKING,
        OrderStatus.READY_FOR_PICKUP,
        OrderStatus.COMPLETED
    ]

    for next_status in flow_statuses:
        time.sleep(10)

        orders_collection.update_one(
            {"_id": order_id},
            {"$set": {"status": next_status}}
        )

        updated_order = orders_collection.find_one(
            {"_id": order_id},
            {"_id": 0}
        )

        emit_order_update_sync(updated_order)


# =====================================
# RATING ROUTES
# =====================================

@fastapi_app.post("/rate-order")
def rate_order(rating: RatingData, current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        rating_data = rating.model_dump()
        rating_data["user_email"] = current_user["email"]
        rating_data["date"] = datetime.now().strftime("%d %b %Y, %I:%M %p")

        ratings_collection.insert_one(rating_data)
        logger.info(f"⭐ Rating saved for {rating.food_name} by {current_user['email']}")

        return {"message": "Rating Saved ⭐"}

    except Exception as e:
        logger.error(f"Rate order error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error"
        )


# =====================================
# FOOD ROUTES (Admin Only)
# =====================================

@fastapi_app.post("/add-food")
async def add_food(
    name: str = Form(...),
    price: float = Form(...),
    category: str = Form(...),
    category_id: str = Form(...),
    description: str = Form(...),
    available: bool = Form(...),
    image: UploadFile = File(...),
    _: Dict[str, Any] = Depends(
        require_role(UserRole.ADMIN)
    )
):
    try:
        from bson import ObjectId

        # --------------------------------
        # Validate category ID
        # --------------------------------

        try:
            category_object_id = ObjectId(category_id)
        except Exception:
            raise HTTPException(
                status_code=400,
                detail="Invalid category ID"
            )

        # --------------------------------
        # Get real active category
        # --------------------------------

        category_doc = categories_collection.find_one({
            "_id": category_object_id,
            "active": True
        })

        if not category_doc:
            raise HTTPException(
                status_code=400,
                detail="Category not found or inactive"
            )

        # --------------------------------
        # Clean values
        # --------------------------------

        name = name.strip()
        description = description.strip()

        # Always use category name from database
        category = category_doc["name"].strip()

        # --------------------------------
        # Check duplicate food
        # --------------------------------

        existing = foods_collection.find_one({
            "name": name
        })

        if existing:
            raise HTTPException(
                status_code=400,
                detail="Food already exists"
            )

        # --------------------------------
        # Save image
        # --------------------------------

        image_path = await save_food_image(image)

        # --------------------------------
        # Create food
        # --------------------------------

        food = {
            "name": name,
            "price": price,
            "category": category,
            "category_id": category_id,
            "description": description,
            "available": available,
            "image": image_path,
        }

        # --------------------------------
        # Save to MongoDB
        # --------------------------------

        result = foods_collection.insert_one(food)

        food["_id"] = str(result.inserted_id)

        logger.info(
            f"🍔 Food added: {name} | Category: {category}"
        )

        return {
            "message": "Food Added Successfully 🍔",
            "food": food
        }

    except HTTPException:
        raise

    except Exception as e:
        logger.error(
            f"Add food error: {e}"
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error"
        )


@fastapi_app.get("/foods")
def get_foods():
    try:
        foods = list(foods_collection.find({}, {"_id": 0}))
        return {"foods": foods}

    except Exception as e:
        logger.error(f"Get foods error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error"
        )


@fastapi_app.put("/update-food/{food_name}")
def update_food(food_name: str, food: FoodData, _: Dict[str, Any] = Depends(require_role(UserRole.ADMIN))):
    try:
        foods_collection.update_one(
            {"name": food_name},
            {"$set": food.model_dump()}
        )
        logger.info(f"✏️ Food updated: {food_name}")
        return {"message": "Food Updated Successfully ✏️"}

    except Exception as e:
        logger.error(f"Update food error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error"
        )


@fastapi_app.delete("/delete-food/{food_name}")
def delete_food(
    food_name: str,
    _: Dict[str, Any] = Depends(require_role(UserRole.ADMIN))
):
    try:
        print("Food received:", food_name)

        print("Foods in DB:")
        for item in foods_collection.find():
            print(repr(item["name"]))

            result = foods_collection.delete_one({
         "name": {
        "$regex": f"^{re.escape(food_name.strip())}\\s*$",
        "$options": "i"
          }
})

        print("Deleted Count:", result.deleted_count)

        if result.deleted_count == 0:
            return {
                "success": False,
                "message": "Food not found"
            }

        logger.info(f"🗑️ Food deleted: {food_name}")

        return {
            "success": True,
            "message": "Food Deleted Successfully 🗑️"
        }

    except Exception as e:
        logger.error(f"Delete food error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error"
        )
def sync_categories_from_foods():
    """
    Create missing category records from the category
    values that already exist in foods_collection.

    This does NOT create food records.
    It does NOT create duplicate categories.
    """

    try:
        food_categories = foods_collection.distinct("category")

        created_count = 0

        for category_name in food_categories:

            if category_name is None:
                continue

            category_name = str(category_name).strip()

            if not category_name:
                continue

            existing = categories_collection.find_one({
                "name": {
                    "$regex": f"^{re.escape(category_name)}$",
                    "$options": "i"
                }
            })

            if existing:
                continue

            categories_collection.insert_one({
                "name": category_name,
                "description": "",
                "image": "",
                "active": True,
                "created_at": datetime.utcnow(),
            })

            created_count += 1

        logger.info(
            f"Category sync completed. Created {created_count} categories."
        )

        return created_count

    except Exception as e:
        logger.exception(
            f"Category sync error: {e}"
        )
        raise
    
@fastapi_app.get("/admin/categories")
def get_categories(
    search: str = "",
    status_filter: str = "ALL",
    sort: str = "LATEST",
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    _: Dict[str, Any] = Depends(
        require_role(UserRole.ADMIN)
    ),
):
    try:
        # ============================================================
        # SYNC CATEGORIES FROM REAL FOOD DATA
        # ============================================================

        sync_categories_from_foods()

        # ============================================================
        # SEARCH
        # ============================================================

        query = {}

        if search.strip():
            query["name"] = {
                "$regex": re.escape(search.strip()),
                "$options": "i",
            }

        # ============================================================
        # STATUS FILTER
        # ============================================================

        if status_filter == "ACTIVE":
            query["active"] = True

        elif status_filter == "INACTIVE":
            query["active"] = False

        # ============================================================
        # SORT
        # ============================================================

        sort_map = {
            "NAME_ASC": [
                ("name", ASCENDING)
            ],
            "NAME_DESC": [
                ("name", DESCENDING)
            ],
            "OLDEST": [
                ("created_at", ASCENDING)
            ],
            "LATEST": [
                ("created_at", DESCENDING)
            ],
        }

        sort_value = sort_map.get(
            sort,
            [("created_at", DESCENDING)]
        )

        # ============================================================
        # REAL DATABASE COUNTS
        # ============================================================

        total_categories = categories_collection.count_documents(
            query
        )

        total = categories_collection.count_documents({})

        active = categories_collection.count_documents({
            "active": True
        })

        inactive = categories_collection.count_documents({
            "active": False
        })

        total_foods = foods_collection.count_documents({})

        # ============================================================
        # PAGINATION
        # ============================================================

        skip = (page - 1) * limit

        category_docs = list(
            categories_collection
            .find(query)
            .sort(sort_value)
            .skip(skip)
            .limit(limit)
        )

        # ============================================================
        # CATEGORY RESPONSE
        # ============================================================

        categories = []

        for category in category_docs:

            category_name = category.get(
                "name",
                ""
            ).strip()

            # --------------------------------------------------------
            # Find real foods belonging to this category
            # --------------------------------------------------------

            category_food_query = {
                "category": {
                    "$regex": f"^{re.escape(category_name)}$",
                    "$options": "i",
                }
            }

            food_count = foods_collection.count_documents(
                category_food_query
            )

            # --------------------------------------------------------
            # Get one real food from this category
            # --------------------------------------------------------

            representative_food = foods_collection.find_one(
                category_food_query,
                {
                    "_id": 0,
                    "description": 1,
                    "image": 1,
                }
            )

            # --------------------------------------------------------
            # Start with category's own data
            # --------------------------------------------------------

            description = category.get(
                "description"
            ) or ""

            image = category.get(
                "image"
            ) or ""

            # --------------------------------------------------------
            # Use real food description as fallback
            # --------------------------------------------------------

            if not description and representative_food:
                description = (
                    representative_food.get(
                        "description"
                    ) or ""
                )

            # --------------------------------------------------------
            # Use real food image as fallback
            # --------------------------------------------------------

            if not image and representative_food:
                image = (
                    representative_food.get(
                        "image"
                    ) or ""
                )

            # --------------------------------------------------------
            # Add category to response
            # --------------------------------------------------------

            categories.append({
                "id": str(category["_id"]),

                "name": category_name,

                "description": description,

                "image": image,

                "active": bool(
                    category.get(
                        "active",
                        True
                    )
                ),

                "food_count": food_count,

                "created_at": (
                    category.get(
                        "created_at"
                    ).isoformat()
                    if category.get(
                        "created_at"
                    )
                    else None
                ),
            })

        # ============================================================
        # FINAL RESPONSE
        # ============================================================

        return {
            "success": True,

            "categories": categories,

            "pagination": {
                "page": page,

                "limit": limit,

                "total": total_categories,

                "pages": (
                    (
                        total_categories
                        + limit
                        - 1
                    )
                    // limit
                    if total_categories
                    else 0
                ),
            },

            "stats": {
                "total_categories": total,

                "active_categories": active,

                "inactive_categories": inactive,

                "total_foods": total_foods,
            },
        }

    except HTTPException:
        raise

    except Exception as e:

        logger.exception(
            f"Get categories error: {e}"
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to load categories"
        )
@fastapi_app.post("/admin/categories/sync")
def sync_categories(
    _: Dict[str, Any] = Depends(require_role(UserRole.ADMIN))
):
    try:
        created = 0

        # Get all existing foods
        foods = foods_collection.find(
            {},
            {"category": 1}
        )

        food_categories = set()

        for food in foods:
            category_name = str(
                food.get("category", "")
            ).strip()

            if category_name:
                food_categories.add(category_name)

        # Create missing categories
        for category_name in food_categories:

            existing = categories_collection.find_one({
                "name": {
                    "$regex": f"^{re.escape(category_name)}$",
                    "$options": "i"
                }
            })

            if existing:
                continue

            categories_collection.insert_one({
                "name": category_name,
                "description": f"{category_name} food items",
                "image": "",
                "active": True,
                "created_at": datetime.utcnow(),
            })

            created += 1

        total = categories_collection.count_documents({})

        return {
            "success": True,
            "message": "Categories synchronized successfully",
            "created": created,
            "total_categories": total
        }

    except Exception as e:
        logger.error(
            f"Category sync error: {e}"
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to synchronize categories"
        )

@fastapi_app.post("/admin/categories")
async def create_category(
    name: str = Form(...),
    description: str = Form(""),
    active: bool = Form(True),
    image: UploadFile | None = File(None),
    _: Dict[str, Any] = Depends(
        require_role(UserRole.ADMIN)
    ),
):
    try:

        name = name.strip()
        description = description.strip()

        if not name:
            raise HTTPException(
                status_code=400,
                detail="Category name is required"
            )

        # -----------------------------
        # DUPLICATE CHECK
        # -----------------------------

        existing = categories_collection.find_one({
            "name": {
                "$regex": f"^{re.escape(name)}$",
                "$options": "i",
            }
        })

        if existing:
            raise HTTPException(
                status_code=409,
                detail="Category already exists"
            )

        image_path = ""

        if image:
            image_path = await save_category_image(
                image
            )

        category = {
            "name": name,
            "description": description,
            "image": image_path,
            "active": active,
            "created_at": datetime.utcnow(),
        }

        result = categories_collection.insert_one(
            category
        )

        category["id"] = str(
            result.inserted_id
        )

        category.pop("_id", None)

        return {
            "success": True,
            "message": "Category created successfully",
            "category": category,
        }

    except HTTPException:
        raise

    except Exception as e:

        logger.error(
            f"Create category error: {e}"
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to create category"
        )

@fastapi_app.put("/admin/categories/{category_id}")
async def update_category(
    category_id: str,
    name: str = Form(...),
    description: str = Form(""),
    active: bool = Form(True),
    image: UploadFile | None = File(None),
    _: Dict[str, Any] = Depends(
        require_role(UserRole.ADMIN)
    ),
):
    try:

        from bson import ObjectId

        try:
            object_id = ObjectId(category_id)
        except Exception:
            raise HTTPException(
                status_code=400,
                detail="Invalid category ID"
            )

        existing = categories_collection.find_one({
            "_id": object_id
        })

        if not existing:
            raise HTTPException(
                status_code=404,
                detail="Category not found"
            )

        old_name = existing["name"]

        name = name.strip()
        description = description.strip()

        if not name:
            raise HTTPException(
                status_code=400,
                detail="Category name is required"
            )

        duplicate = categories_collection.find_one({
            "_id": {"$ne": object_id},
            "name": {
                "$regex": f"^{re.escape(name)}$",
                "$options": "i",
            }
        })

        if duplicate:
            raise HTTPException(
                status_code=409,
                detail="Another category with this name already exists"
            )

        update_data = {
            "name": name,
            "description": description,
            "active": active,
        }

        if image:
            update_data["image"] = (
                await save_category_image(image)
            )

        categories_collection.update_one(
            {"_id": object_id},
            {"$set": update_data}
        )

        # --------------------------------
        # If name changed, update foods too
        # --------------------------------

        if old_name.strip().lower() != name.lower():

            foods_collection.update_many(
                {
                    "category": {
                        "$regex":
                            f"^{re.escape(old_name.strip())}$",
                        "$options": "i",
                    }
                },
                {
                    "$set": {
                        "category": name
                    }
                }
            )

        return {
            "success": True,
            "message": "Category updated successfully"
        }

    except HTTPException:
        raise

    except Exception as e:

        logger.error(
            f"Update category error: {e}"
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to update category"
        )

@fastapi_app.patch(
    "/admin/categories/{category_id}/status"
)
def update_category_status(
    category_id: str,
    active: bool,
    _: Dict[str, Any] = Depends(
        require_role(UserRole.ADMIN)
    ),
):
    try:

        from bson import ObjectId

        result = categories_collection.update_one(
            {
                "_id": ObjectId(category_id)
            },
            {
                "$set": {
                    "active": active
                }
            }
        )

        if result.matched_count == 0:
            raise HTTPException(
                status_code=404,
                detail="Category not found"
            )

        return {
            "success": True,
            "message": (
                "Category activated"
                if active
                else "Category deactivated"
            )
        }

    except HTTPException:
        raise

    except Exception as e:

        logger.error(
            f"Category status error: {e}"
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to update category status"
        )
    
@fastapi_app.delete(
    "/admin/categories/{category_id}"
)
def delete_category(
    category_id: str,
    _: Dict[str, Any] = Depends(
        require_role(UserRole.ADMIN)
    ),
):
    try:

        from bson import ObjectId

        category = categories_collection.find_one({
            "_id": ObjectId(category_id)
        })

        if not category:
            raise HTTPException(
                status_code=404,
                detail="Category not found"
            )

        category_name = category["name"]

        food_count = foods_collection.count_documents({
            "category": {
                "$regex":
                    f"^{re.escape(category_name)}$",
                "$options": "i",
            }
        })

        if food_count > 0:
            raise HTTPException(
                status_code=409,
                detail=(
                    f"Cannot delete category. "
                    f"{food_count} food item(s) "
                    f"belong to this category."
                )
            )

        result = categories_collection.delete_one({
            "_id": ObjectId(category_id)
        })

        if result.deleted_count == 0:
            raise HTTPException(
                status_code=404,
                detail="Category not found"
            )

        return {
            "success": True,
            "message": "Category deleted successfully"
        }

    except HTTPException:
        raise

    except Exception as e:

        logger.error(
            f"Delete category error: {e}"
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to delete category"
        )

# =====================================
# IMAGE UPLOAD
# =====================================

@fastapi_app.post("/upload-image")
async def upload_image(file: UploadFile = File(...), current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)):
    try:
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Only image files are allowed. Supported: {', '.join(ALLOWED_IMAGE_TYPES)}"
            )

        filename = file.filename.lower()
        if not any(filename.endswith(ext) for ext in ALLOWED_IMAGE_EXTENSIONS):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file extension. Supported: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}"
            )

        file_content = await file.read()
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds {MAX_FILE_SIZE // (1024*1024)}MB limit"
            )

        result = cloudinary.uploader.upload(file_content)

        logger.info(f"📷 Image uploaded: {result['secure_url']}")

        return {"image_url": result["secure_url"]}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image upload error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error"
        )


# =====================================
# FOOD ORDER PAYMENT ROUTES (Razorpay-verified)
# Flow: create-razorpay-order prices the cart from the DB and issues a
# signed intent -> user pays -> verify-payment checks the signature AND
# that the intent matches this exact payment before creating the order.
# =====================================

@fastapi_app.post("/create-razorpay-order")
@limiter.limit("10/minute")
def create_payment_order(request: Request, data: CreateFoodOrderData, current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        order_items, total = _price_items_from_db(data.items)
        amount_paise = int(round(total * 100))

        razorpay_order = razorpay_client.order.create({
            "amount": amount_paise,
            "currency": "INR",
            "payment_capture": 1
        })

        order_intent = create_signed_intent(
            "food_order",
            {
                "email": current_user["email"],
                "items": order_items,
                "total": total,
                "name": data.name,
                "phone": data.phone,
                "location": data.location,
                "razorpay_order_id": razorpay_order["id"],
            },
        )

        logger.info(f"💰 Razorpay order created: {razorpay_order['id']} for {current_user['email']}")

        return {
            "success": True,
            "order_id": razorpay_order["id"],
            "amount": razorpay_order["amount"],
            "currency": razorpay_order["currency"],
            "key": RAZORPAY_KEY_ID,
            "total": total,
            "order_intent": order_intent,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create payment order error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error"
        )


@fastapi_app.post("/verify-payment")
async def verify_payment(data: VerifyPaymentData, current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        intent = decode_signed_intent(data.order_intent, "food_order")

        if intent.get("razorpay_order_id") != data.razorpay_order_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Order reference does not match this payment"
            )

        if intent.get("email") != current_user["email"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This order reference belongs to a different account"
            )

        if payments_collection.find_one({"payment_id": data.razorpay_payment_id}):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment already processed"
            )

        razorpay_client.utility.verify_payment_signature({
            "razorpay_order_id": data.razorpay_order_id,
            "razorpay_payment_id": data.razorpay_payment_id,
            "razorpay_signature": data.razorpay_signature,
        })

        order = {
            "items": intent["items"],
            "total": intent["total"],
            "email": intent["email"],
            "name": intent["name"],
            "phone": intent["phone"],
            "location": intent["location"],
            "payment_method": "ONLINE",
            "payment_status": PaymentStatus.PAID,
            "payment_id": data.razorpay_payment_id,
            "razorpay_order_id": data.razorpay_order_id,
            "razorpay_signature": data.razorpay_signature,  # kept for auditing
            "payment_date": datetime.now().strftime("%d %b %Y, %I:%M %p"),
            "payment_amount": intent["total"],
            "status": OrderStatus.PREPARING,
            "created_at": datetime.now(),
            "date": datetime.now().strftime("%d %b %Y, %I:%M %p"),
            "estimated_time": "15-20 mins",
            "pickup_code": random.randint(1000, 9999),
            "token": get_next_token(),
            "user_email": current_user["email"],
        }

        result = orders_collection.insert_one(order)

        saved_order = orders_collection.find_one(
            {"_id": result.inserted_id},
            {"_id": 0}
        )

        users_collection.update_one(
            {"email": intent["email"]},
            {
                "$inc": {
                    "total_orders": 1,
                    "total_spent": intent["total"]
                }
            }
        )

        payment = {
            "email": intent["email"],
            "payment_id": data.razorpay_payment_id,
            "order_id": data.razorpay_order_id,
            "razorpay_signature": data.razorpay_signature,  # kept for auditing
            "amount": intent["total"],
            "status": PaymentStatus.PAID,
            "date": datetime.now().strftime("%d %b %Y, %I:%M %p"),
            "user_email": current_user["email"],
        }

        try:
            payments_collection.insert_one(payment)
        except DuplicateKeyError:
            # A concurrent duplicate submission already recorded this
            # payment_id — surface a clean 400 instead of a 500.
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment already processed"
            )

        await safe_emit_order_update(saved_order)

        threading.Thread(
            target=update_order_flow,
            args=(result.inserted_id,),
            daemon=True
        ).start()

        logger.info(f"✅ Payment verified: {data.razorpay_payment_id}")

        return {
            "success": True,
            "message": "Payment Verified Successfully",
            "payment_id": data.razorpay_payment_id,
            "order": saved_order,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Verify payment error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error"
        )


@fastapi_app.post("/save-payment")
def save_payment(payment: SavePaymentData, _: Dict[str, Any] = Depends(require_role(UserRole.ADMIN))):
    # Restricted to admins: this endpoint accepts a payment record with no
    # signature verification, so letting any authenticated user call it
    # would mean anyone could insert a fake "Paid" record for themselves.
    # Kept for manual reconciliation by staff only.
    try:
        payment_data = {
            "email": normalize_email(payment.order_id) if "@" in payment.order_id else None,
            "order_id": payment.order_id,
            "payment_id": payment.payment_id,
            "amount": payment.amount,
            "status": payment.status,
            "date": datetime.now().strftime("%d %b %Y, %I:%M %p"),
            "recorded_by": _["email"],
        }

        try:
            payments_collection.insert_one(payment_data)
        except DuplicateKeyError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment already recorded"
            )

        logger.info(f"💳 Payment manually saved by admin {_['email']}: {payment.payment_id}")

        return {"success": True, "message": "Payment Saved Successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Save payment error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error"
        )


# =====================================
# ADMIN ROUTES (Protected)
# =====================================

@fastapi_app.get("/admin/orders")
def get_admin_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    _: Dict[str, Any] = Depends(require_role(UserRole.ADMIN)),
):
    try:
        total = orders_collection.count_documents({})
        skip = (page - 1) * limit

        orders = list(
            orders_collection.find({})
            .sort("token", -1)
            .skip(skip)
            .limit(limit)
        )

        for order in orders:
            order["order_id"] = str(order["_id"])
            del order["_id"]

        pages = (total + limit - 1) // limit if total else 0

        return {
            "success": True,
            "orders": orders,
            "page": page,
            "limit": limit,
            "total": total,
            "pages": pages,
        }

    except Exception as e:
        logger.error(f"Get admin orders error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error"
        )
@fastapi_app.get("/admin/revenue-chart-data")
def get_revenue_chart_data(
    year: int | None = None,
    _: Dict[str, Any] = Depends(require_role(UserRole.ADMIN)),
):
    try:
        from datetime import datetime

        # If no year is supplied, use the current year
        if year is None:
            year = datetime.now().year

        monthly_revenue = {
            month: 0.0
            for month in range(1, 13)
        }

        # Only use actual paid/completed orders
        query = {
            "payment_status": PaymentStatus.PAID,
            "status": OrderStatus.COMPLETED,
        }

        orders = orders_collection.find(query)

        # Prevent the same order from being counted twice
        seen_order_ids = set()

        for order in orders:
            order_id = str(order["_id"])

            if order_id in seen_order_ids:
                continue

            seen_order_ids.add(order_id)

            # Get order date
            order_date = order.get("date")

            if not order_date:
                continue

            try:
                parsed_date = datetime.strptime(
                    order_date,
                    "%d %b %Y, %I:%M %p"
                )
            except (ValueError, TypeError):
                continue

            # Only include orders from requested year
            if parsed_date.year != year:
                continue

            # Get the real order total
            total = order.get("total", 0)

            try:
                total = float(total)
            except (TypeError, ValueError):
                continue

            monthly_revenue[parsed_date.month] += total

        months = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ]

        revenue = [
            {
                "month": months[month - 1],
                "revenue": monthly_revenue[month],
            }
            for month in range(1, 13)
        ]

        return {
            "success": True,
            "year": year,
            "revenue": revenue,
        }

    except Exception as e:
        logger.error(
            f"Revenue chart error: {e}"
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load revenue chart data",
        )
    
@fastapi_app.get("/admin/top-selling-foods")
def get_top_selling_foods(
    month: str = Query(..., pattern=r"^\d{4}-\d{2}$"),
    _: Dict[str, Any] = Depends(require_role(UserRole.ADMIN)),
):
    try:
        year, month_number = map(int, month.split("-"))

        start_date = datetime(year, month_number, 1)

        if month_number == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month_number + 1, 1)

        # Get all orders that could contain sales.
        orders = orders_collection.find({
            "status": OrderStatus.COMPLETED,
            "payment_status": PaymentStatus.PAID,
        })

        food_totals = {}

        for order in orders:
            order_date_string = order.get("date")

            if not order_date_string:
                continue

            try:
                order_date = datetime.strptime(
                    order_date_string,
                    "%d %b %Y, %I:%M %p"
                )
            except (ValueError, TypeError):
                continue

            # Only include orders from selected month.
            if not (start_date <= order_date < end_date):
                continue

            # Process each order's items.
            for item in order.get("items", []):
                food_name = item.get("name")
                quantity = item.get("quantity", 0)

                if not food_name:
                    continue

                try:
                    quantity = int(quantity)
                except (ValueError, TypeError):
                    continue

                if quantity <= 0:
                    continue

                food_totals[food_name] = (
                    food_totals.get(food_name, 0) + quantity
                )

        # Nothing sold during selected month.
        if not food_totals:
            return {
                "success": True,
                "month": month,
                "foods": [],
                "total_quantity": 0,
            }

        total_quantity = sum(food_totals.values())

        foods = []

        for name, quantity in food_totals.items():
            percentage = round(
                (quantity / total_quantity) * 100,
                1
            )

            foods.append({
                "name": name,
                "quantity": quantity,
                "percentage": percentage,
            })

        # Highest-selling food first.
        foods.sort(
            key=lambda food: food["quantity"],
            reverse=True
        )

        return {
            "success": True,
            "month": month,
            "foods": foods,
            "total_quantity": total_quantity,
        }

    except Exception as e:
        logger.error(
            f"Top selling foods error: {e}"
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error"
        )

@fastapi_app.get("/admin/sales-distribution")
async def get_sales_distribution(
    month: str,
    current_user=Depends(get_current_user)
):
    try:
        # -----------------------------------------
        # 1. ADMIN CHECK
        # -----------------------------------------
        if current_user.get("role") != "ADMIN":
            raise HTTPException(
                status_code=403,
                detail="Admin access required"
            )

        # -----------------------------------------
        # 2. VALIDATE MONTH
        # -----------------------------------------
        try:
            selected_month = datetime.strptime(
                month,
                "%Y-%m"
            )
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=400,
                detail="Invalid month format. Use YYYY-MM"
            )

        # -----------------------------------------
        # 3. GET COMPLETED + PAID ORDERS
        #
        # IMPORTANT:
        # No await here because your MongoDB
        # collection is returning normal lists.
        # -----------------------------------------
        orders = list(
            orders_collection.find({
                "status": OrderStatus.COMPLETED,
                "payment_status": PaymentStatus.PAID
            })
        )

        category_quantities = {}

        # -----------------------------------------
        # 4. PROCESS EACH ORDER ONCE
        # -----------------------------------------
        for order in orders:

            order_date = order.get("date")

            if not order_date:
                continue

            # -------------------------------------
            # Parse date
            # -------------------------------------
            if isinstance(order_date, datetime):
                parsed_date = order_date

            elif isinstance(order_date, str):
                try:
                    parsed_date = datetime.strptime(
                        order_date,
                        "%d %b %Y, %I:%M %p"
                    )
                except ValueError:
                    continue

            else:
                continue

            # -------------------------------------
            # Only selected month
            # -------------------------------------
            if (
                parsed_date.year != selected_month.year
                or parsed_date.month != selected_month.month
            ):
                continue

            # -------------------------------------
            # 5. PROCESS ITEMS
            # -------------------------------------
            items = order.get("items", [])

            if not isinstance(items, list):
                continue

            for item in items:

                if not isinstance(item, dict):
                    continue

                food_name = item.get("name")

                if not food_name:
                    continue

                # ---------------------------------
                # Quantity
                # ---------------------------------
                try:
                    quantity = int(
                        item.get("quantity", 0)
                    )
                except (TypeError, ValueError):
                    continue

                if quantity <= 0:
                    continue

                # ---------------------------------
                # 6. GET REAL FOOD CATEGORY
                #
                # IMPORTANT:
                # No await here.
                # ---------------------------------
                food = foods_collection.find_one({
                    "name": food_name
                })

                if not food:
                    continue

                category = food.get("category")

                if not category:
                    continue

                category = str(category).strip()

                if not category:
                    continue

                # ---------------------------------
                # 7. ADD QUANTITY
                # ---------------------------------
                category_quantities[category] = (
                    category_quantities.get(category, 0)
                    + quantity
                )

        # -----------------------------------------
        # 8. NO SALES DATA
        # -----------------------------------------
        if not category_quantities:
            return {
                "month": month,
                "total_quantity": 0,
                "categories": []
            }

        # -----------------------------------------
        # 9. TOTAL SOLD QUANTITY
        # -----------------------------------------
        total_quantity = sum(
            category_quantities.values()
        )

        if total_quantity <= 0:
            return {
                "month": month,
                "total_quantity": 0,
                "categories": []
            }

        # -----------------------------------------
        # 10. BUILD CATEGORY DATA
        # -----------------------------------------
        categories = []

        for category, quantity in category_quantities.items():

            percentage = (
                quantity / total_quantity
            ) * 100

            categories.append({
                "name": category,
                "quantity": quantity,
                "percentage": round(
                    percentage,
                    1
                )
            })

        # -----------------------------------------
        # 11. SORT HIGHEST FIRST
        # -----------------------------------------
        categories.sort(
            key=lambda item: item["quantity"],
            reverse=True
        )

        # -----------------------------------------
        # 12. RETURN REAL DATABASE DATA
        # -----------------------------------------
        return {
            "month": month,
            "total_quantity": total_quantity,
            "categories": categories
        }

    except HTTPException:
        raise

    except Exception as exc:
        print(
            "========== SALES DISTRIBUTION ERROR =========="
        )
        print(
            f"Error type: {type(exc).__name__}"
        )
        print(
            f"Error message: {exc}"
        )
        print(
            "==============================================="
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to calculate sales distribution"
        )
    
@fastapi_app.get("/admin/order-chart-data")
def get_admin_order_chart_data(
    _: Dict[str, Any] = Depends(require_role(UserRole.ADMIN)),
):
    try:
        orders = list(
            orders_collection.find(
                {},
                {
                    "_id": 1,
                    "date": 1,
                    "status": 1,
                }
            )
        )

        result = []

        for order in orders:
            result.append({
                "order_id": str(order["_id"]),
                "date": order.get("date"),
                "status": order.get("status"),
            })

        return {
            "success": True,
            "orders": result,
        }

    except Exception as e:
        logger.error(f"Order chart data error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch order chart data",
        )
    
@fastapi_app.get("/admin/orders/{order_id}")
def get_admin_order(order_id: str, _: Dict[str, Any] = Depends(require_role(UserRole.ADMIN))):
    try:
        order = orders_collection.find_one({"_id": parse_object_id(order_id)})

        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )

        order["order_id"] = str(order["_id"])
        del order["_id"]

        return order

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get admin order error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error"
        )


@fastapi_app.put("/admin/orders/{token}")
async def admin_update_order_status(token: int, data: StatusUpdate, _: Dict[str, Any] = Depends(require_role(UserRole.ADMIN))):
    try:
        existing_order = orders_collection.find_one({"token": token})
        if not existing_order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order with token #{token} not found"
            )

        orders_collection.update_one(
            {"token": token},
            {"$set": {"status": data.status}}
        )

        updated_order = orders_collection.find_one({"token": token})
        updated_order["order_id"] = str(updated_order["_id"])
        del updated_order["_id"]

        await safe_emit_order_update(updated_order)

        logger.info(f"✅ Admin updated order #{token} to {data.status}")

        return {
            "success": True,
            "message": f"Order #{token} status updated to {data.status}",
            "order": updated_order
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin update order error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error"
        )

@fastapi_app.get("/admin/recent-orders")
def get_recent_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(5, ge=1),
    search: str = "",
    status: str = "All",
    sortBy: str = "token",
    sortOrder: str = "desc",
    current_user=Depends(require_role("ADMIN"))
):
    query = {}

    if status != "All":
        query["status"] = status

    if search:
        query["name"] = {
            "$regex": search,
            "$options": "i"
        }

    allowed_fields = {
        "token",
        "name",
        "total",
        "status",
        "date",
    }

    if sortBy not in allowed_fields:
        sortBy = "token"

    direction = -1 if sortOrder == "desc" else 1

    total = orders_collection.count_documents(query)

    cursor = (
        orders_collection.find(query)
        .sort(sortBy, direction)
        .skip((page - 1) * limit)
        .limit(limit)
    )

    orders = []

    for order in cursor:
        orders.append({
            "token": order.get("token"),
            "name": order.get("name"),
            "total": order.get("total"),
            "status": order.get("status"),
            "date": order.get("date"),
        })

    return {
        "orders": orders,
        "page": page,
        "limit": limit,
        "total": total,
        "totalPages": (total + limit - 1) // limit,
    }

@fastapi_app.get("/admin/dashboard")
def admin_dashboard(
    _: Dict[str, Any] = Depends(require_role(UserRole.ADMIN))
):
    try:
        total_orders = orders_collection.count_documents({})

        completed_orders = orders_collection.count_documents({
            "status": OrderStatus.COMPLETED
        })

        pending_orders = orders_collection.count_documents({
            "status": {
                "$in": [
                    OrderStatus.PREPARING,
                    OrderStatus.COOKING,
                    OrderStatus.READY_FOR_PICKUP
                ]
            }
        })
                # Calculate the busiest ordering hour from completed orders
        peak_hour_pipeline = [
            {
                "$match": {
                    "status": OrderStatus.COMPLETED,
                    "date": {"$exists": True, "$ne": None}
                }
            },
            {
                "$addFields": {
                    "order_datetime": {
                        "$dateFromString": {
                            "dateString": "$date",
                            "format": "%d %b %Y, %I:%M %p",
                            "onError": None,
                            "onNull": None
                        }
                    }
                }
            },
            {
                "$match": {
                    "order_datetime": {"$ne": None}
                }
            },
            {
                "$group": {
                    "_id": {
                        "$hour": "$order_datetime"
                    },
                    "count": {"$sum": 1}
                }
            },
            {
                "$sort": {
                    "count": -1,
                    "_id": 1
                }
            },
            {
                "$limit": 1
            }
        ]

        peak_hour_result = list(
            orders_collection.aggregate(peak_hour_pipeline)
        )

        if peak_hour_result:
            peak_hour = peak_hour_result[0]["_id"]

            start_period = "AM" if peak_hour < 12 else "PM"

            display_hour = peak_hour % 12
            if display_hour == 0:
                display_hour = 12

            next_hour = (peak_hour + 1) % 24
            next_display_hour = next_hour % 12

            if next_display_hour == 0:
                next_display_hour = 12

            next_period = "AM" if next_hour < 12 else "PM"

            peak_ordering_hours = (
                f"{display_hour}:00 {start_period} – "
                f"{next_display_hour}:00 {next_period}"
            )
        else:
            peak_ordering_hours = "No data"
        # -----------------------------------------
        # ALL-TIME REVENUE
        # -----------------------------------------
        revenue_pipeline = [
            {
                "$match": {
                    "payment_status": PaymentStatus.PAID
                }
            },
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
            orders_collection.aggregate(revenue_pipeline)
        )

        total_revenue = (
            revenue_result[0]["total"]
            if revenue_result
            else 0
        )

        # -----------------------------------------
        # TODAY'S REVENUE
        # -----------------------------------------
        now = datetime.now()

        start_of_day = now.replace(
            hour=0,
            minute=0,
            second=0,
            microsecond=0
        )

        end_of_day = start_of_day + timedelta(days=1)

        today_revenue_pipeline = [
            {
                "$match": {
                    "payment_status": PaymentStatus.PAID,
                    "created_at": {
                        "$gte": start_of_day,
                        "$lt": end_of_day
                    }
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total": {
                        "$sum": "$total"
                    }
                }
            }
        ]

        today_revenue_result = list(
            orders_collection.aggregate(
                today_revenue_pipeline
            )
        )

        today_revenue = (
            today_revenue_result[0]["total"]
            if today_revenue_result
            else 0
        )

        return {
            "total_orders": total_orders,
            "total_revenue": total_revenue,
            "today_revenue": today_revenue,
            "pending_orders": pending_orders,
            "completed_orders": completed_orders,
            "peak_ordering_hours": peak_ordering_hours,
        }

    except Exception as e:
        logger.error(
            f"Admin dashboard error: {e}"
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error"
        )
@fastapi_app.get("/admin/users")
def get_admin_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    _: Dict[str, Any] = Depends(require_role(UserRole.ADMIN)),
):
    try:
        total = users_collection.count_documents({})
        skip = (page - 1) * limit

        users = list(
            users_collection.find(
                {},
                {"_id": 0, "password": 0, "refresh_token_hash": 0}
            )
            .sort("created_at", -1)
            .skip(skip)
            .limit(limit)
        )

        pages = (total + limit - 1) // limit if total else 0

        return {
            "success": True,
            "users": users,
            "page": page,
            "limit": limit,
            "total": total,
            "pages": pages,
        }

    except Exception as e:
        logger.error(f"Get admin users error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error"
        )


@fastapi_app.put("/admin/users/{email}/role")
def update_user_role(email: str, role: str, _: Dict[str, Any] = Depends(require_role(UserRole.ADMIN))):
    try:
        if role not in [UserRole.ADMIN, UserRole.USER]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role"
            )

        result = users_collection.update_one(
            {"email": normalize_email(email)},
            {"$set": {"role": role}}
        )

        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        logger.info(f"👤 User role updated: {email} → {role}")

        return {
            "success": True,
            "message": f"User role updated to {role}"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update user role error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error"
        )


@fastapi_app.post("/admin/wallet/adjust")
def admin_adjust_wallet(data: AdminWalletAdjustData, current_user: Dict[str, Any] = Depends(require_role(UserRole.ADMIN))):
    try:
        email = normalize_email(data.email)
        target_user = users_collection.find_one({"email": email})

        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        if data.type == "debit" and target_user.get("wallet", 0) < data.amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insufficient wallet balance to debit"
            )

        delta = data.amount if data.type == "credit" else -data.amount

        users_collection.update_one(
            {"email": email},
            {
                "$inc": {"wallet": delta},
                "$push": {
                    "wallet_history": {
                        "type": data.type,
                        "amount": data.amount,
                        "reason": f"Admin adjustment: {data.reason}",
                        "adjusted_by": current_user["email"],
                        "date": datetime.now().strftime("%d %b %Y, %I:%M %p"),
                    }
                },
            },
        )

        logger.info(f"🛠️ Admin {current_user['email']} applied {data.type} of ₹{data.amount} to {email}")

        return {
            "success": True,
            "message": f"Wallet {data.type} applied successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin wallet adjust error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error"
        )


# =====================================
# NOTIFICATION ROUTE
# =====================================

@fastapi_app.get("/send-test-notification")
def send_test_notification(current_user: Dict[str, Any] = Depends(require_role(UserRole.ADMIN))):
    if not FCM_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="FCM token not configured"
        )

    try:
        message = messaging.Message(
            notification=messaging.Notification(
                title="CampusVita",
                body=f"Test notification for {current_user['email']} 🚀",
            ),
            token=FCM_TOKEN,
        )

        response = messaging.send(message)

        logger.info(f"📱 Notification sent: {response}")

        return {"success": True, "response": response}

    except Exception as e:
        logger.error(f"Send notification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error"
        )


# =====================================
# STATIC FILES
# =====================================

if not os.path.exists("uploads"):
    os.makedirs("uploads")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

fastapi_app.mount(
    "/uploads",
    StaticFiles(directory=os.path.join(BASE_DIR, "uploads")),
    name="uploads",
)

@fastapi_app.websocket("/ws/admin/orders")

async def admin_orders_socket(websocket: WebSocket):

    await manager.connect(websocket)

    try:

        while True:

            # keep the socket alive

            await asyncio.sleep(30)

            await websocket.send_json({

                "event": "ping"

            })

    except WebSocketDisconnect:

        manager.disconnect(websocket)

    except Exception as e:

        print("WebSocket Error:", e)

        manager.disconnect(websocket)
# =====================================
# FINAL SOCKET APP
# =====================================

app = socketio.ASGIApp(
    sio,
    fastapi_app
)