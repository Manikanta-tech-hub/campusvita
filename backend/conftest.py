
"""
Shared pytest fixtures for CampusVita backend tests.

Import backend.main once per test session with Firebase mocked.
No real Firebase credentials or production database required.
"""

import asyncio
import os
import sys
import types
from unittest.mock import MagicMock, patch

import pytest


# Starlette TestClient creates a background AnyIO portal.  On this Windows
# Python 3.13 environment the Proactor policy blocks while creating its
# socket-pair wakeup channel; the selector policy is test-only and avoids
# that platform-specific deadlock.
@pytest.fixture(scope="session", autouse=True)
def windows_test_event_loop_policy():
    original_policy = asyncio.get_event_loop_policy()
    if (
        sys.platform == "win32"
        and hasattr(asyncio, "WindowsSelectorEventLoopPolicy")
    ):
        asyncio.set_event_loop_policy(
            asyncio.WindowsSelectorEventLoopPolicy()
        )
    yield
    asyncio.set_event_loop_policy(original_policy)


@pytest.fixture(scope="session")
def isolated_backend_module():
    database_module = types.ModuleType("database")
    for collection_name in (
        "users_collection",
        "orders_collection",
        "ratings_collection",
        "foods_collection",
        "payments_collection",
        "refunds_collection",
        "counters_collection",
        "categories_collection",
        "stalls_collection",
        "vendor_invitations_collection",
    ):
        setattr(database_module, collection_name, MagicMock())

    firebase_modules = {
        "firebase_admin": MagicMock(),
        "firebase_admin.credentials": MagicMock(),
        "firebase_admin.auth": MagicMock(),
    }
    test_environment = {
        "RAZORPAY_KEY_ID": "test_key",
        "RAZORPAY_KEY_SECRET": "test_secret",
        "RAZORPAY_WEBHOOK_SECRET": "test_webhook_secret",
        "CLOUDINARY_CLOUD_NAME": "test_cloud",
        "CLOUDINARY_API_KEY": "test_key",
        "CLOUDINARY_API_SECRET": "test_secret",
        "JWT_SECRET": "test_jwt_secret",
        "MONGO_URL": "mongodb://invalid.test/campusvita_test",
        "MONGODB_DB_NAME": "campusvita_test",
    }

    with (
        patch.dict(os.environ, test_environment),
        patch.dict(
            sys.modules,
            {
                **firebase_modules,
                "database": database_module,
            },
        ),
    ):
        import backend.main as main
        yield main


@pytest.fixture(scope="session")
def backend_module(isolated_backend_module):
    return isolated_backend_module
