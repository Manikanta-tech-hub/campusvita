
#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
CampusVita Sprint 01 regression tests.

Tests:
1. Anonymous order tracking is rejected.
2. Authenticated customers cannot use vendor status updates.
3. Authenticated vendors cannot update stalls they do not own.

MongoDB writes are mocked. No production database is accessed.
"""

import sys
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="module")
def app(isolated_backend_module):
    return isolated_backend_module.fastapi_app


@pytest.fixture
def client(app, backend_module):
    # FastAPI startup normally creates MongoDB indexes.  Tests exercise
    # mocked request paths only, so keep startup entirely in-process.
    with patch.object(
        backend_module,
        "create_indexes",
        new_callable=AsyncMock,
    ):
        with TestClient(app) as test_client:
            yield test_client


@pytest.fixture
def authenticated_user(app, backend_module):
    """
    Replace only token authentication.

    The actual require_role and get_vendor_stall_ids
    authorization functions remain active.
    """
    def set_user(identity):
        app.dependency_overrides[
            backend_module.get_current_user
        ] = lambda: identity

    yield set_user

    app.dependency_overrides.pop(
        backend_module.get_current_user,
        None,
    )


def test_unauthenticated_tracking_rejected(client):
    response = client.get("/track-order/12345")

    assert response.status_code == 401


def test_fcm_token_is_bound_to_authenticated_user(
    client,
    backend_module,
    authenticated_user,
):
    authenticated_user({
        "email": "student@test.com",
        "role": "USER",
    })

    with patch.object(backend_module, "users_collection") as users:
        users.update_one.return_value.matched_count = 1

        response = client.post(
            "/save-fcm-token",
            json={"fcm_token": "device-token"},
        )

        assert response.status_code == 200, response.text
        users.update_one.assert_called_once_with(
            {"email": "student@test.com"},
            {"$set": {"fcm_token": "device-token"}},
        )


def test_admin_orders_rejects_non_admin(
    client,
    authenticated_user,
):
    authenticated_user({
        "email": "student@test.com",
        "role": "USER",
    })

    response = client.get("/admin/orders")

    assert response.status_code == 403, response.text


def test_authenticated_customer_cannot_update_vendor_status(
    client,
    backend_module,
    authenticated_user,
):
    authenticated_user({
        "email": "customer@test.com",
        "role": "CUSTOMER",
    })

    with patch.object(
        backend_module,
        "orders_collection",
    ) as mock_orders:

        response = client.put(
            "/vendor/orders/12345/status",
            params={"stall_id": "stall_a"},
            json={"status": "Accepted"},
        )

        assert response.status_code == 403, (
            response.text
        )

        mock_orders.update_one.assert_not_called()


def test_vendor_cannot_update_unowned_stall(
    client,
    backend_module,
    authenticated_user,
):
    authenticated_user({
        "email": "vendor_a@test.com",
        "role": "VENDOR",
    })

    with (
        patch.object(
            backend_module,
            "stalls_collection",
        ) as mock_stalls,
        patch.object(
            backend_module,
            "orders_collection",
        ) as mock_orders,
    ):
        # Vendor A owns only stall_a.
        mock_stalls.find.return_value = [
            {"_id": "stall_a"}
        ]

        # Vendor A attempts to modify stall_b.
        response = client.put(
            "/vendor/orders/12345/status",
            params={"stall_id": "stall_b"},
            json={"status": "Accepted"},
        )

        assert response.status_code == 403, (
            response.text
        )

        mock_stalls.find.assert_called_once_with(
            {
                "owner_email": "vendor_a@test.com",
                "active": True,
            },
            {"_id": 1},
        )

        mock_orders.update_one.assert_not_called()


from copy import deepcopy
from types import SimpleNamespace


def test_vendor_updates_only_owned_stall(
    client,
    backend_module,
    authenticated_user,
):
    """Vendor A updates stall_a; stall_b remains unchanged."""

    authenticated_user({
        "email": "vendor_a@test.com",
        "role": "VENDOR",
    })

    stored_order = {
        "_id": "test-order-1",
        "token": 12345,
        "items": [
            {"stall_id": "stall_a", "name": "Tea"},
            {"stall_id": "stall_b", "name": "Coffee"},
        ],
        "stall_orders": [
            {
                "stall_id": "stall_a",
                "status": "Pending",
                "estimatedPreparationMinutes": 10,
            },
            {
                "stall_id": "stall_b",
                "status": "Pending",
                "estimatedPreparationMinutes": 15,
            },
        ],
    }

    original_stall_b = deepcopy(
        stored_order["stall_orders"][1]
    )

    class IsolatedOrdersCollection:
        def __init__(self, order):
            self.order = deepcopy(order)
            self.update_calls = 0

        def find_one(self, query):
            if (
                query.get("token") == self.order["token"]
                or query.get("_id") == self.order["_id"]
            ):
                return deepcopy(self.order)
            return None

        def update_one(self, query, update):
            self.update_calls += 1

            assert query["_id"] == self.order["_id"]

            condition = query["stall_orders"]["$elemMatch"]
            stall_id = condition["stall_id"]
            expected_status = condition["status"]

            target = next(
                (
                    entry
                    for entry in self.order["stall_orders"]
                    if entry["stall_id"] == stall_id
                    and entry["status"] == expected_status
                ),
                None,
            )

            if target is None:
                return SimpleNamespace(matched_count=0)

            for key, value in update["$set"].items():
                assert key.startswith("stall_orders.$.")
                field = key.removeprefix("stall_orders.$.")
                target[field] = value

            return SimpleNamespace(matched_count=1)

    isolated_orders = IsolatedOrdersCollection(stored_order)

    async def fake_emit(_order):
        return None

    with (
        patch.object(
            backend_module,
            "stalls_collection",
        ) as mock_stalls,
        patch.object(
            backend_module,
            "orders_collection",
            isolated_orders,
        ),
        patch.object(
            backend_module,
            "send_order_status_push_notification",
        ),
        patch.object(
            backend_module,
            "safe_emit_order_update",
            fake_emit,
        ),
    ):
        mock_stalls.find.return_value = [
            {"_id": "stall_a"}
        ]

        response = client.put(
            "/vendor/orders/12345/status",
            params={"stall_id": "stall_a"},
            json={"status": "Accepted"},
        )

    assert response.status_code == 200, response.text
    assert response.json()["success"] is True

    assert isolated_orders.update_calls == 1

    updated_stall_a = isolated_orders.order["stall_orders"][0]
    updated_stall_b = isolated_orders.order["stall_orders"][1]

    assert updated_stall_a["status"] == "Accepted"
    assert updated_stall_b == original_stall_b


def test_vendor_concurrent_update_returns_conflict(
    client,
    backend_module,
    authenticated_user,
):
    """A stale vendor status update must return HTTP 409."""

    authenticated_user({
        "email": "vendor_a@test.com",
        "role": "VENDOR",
    })

    order = {
        "_id": "concurrent-test-order",
        "token": 12346,
        "items": [
            {"stall_id": "stall_a", "name": "Tea"},
        ],
        "stall_orders": [
            {
                "stall_id": "stall_a",
                "status": "Pending",
                "estimatedPreparationMinutes": 10,
            },
        ],
    }

    with (
        patch.object(
            backend_module,
            "stalls_collection",
        ) as mock_stalls,
        patch.object(
            backend_module,
            "orders_collection",
        ) as mock_orders,
        patch.object(
            backend_module,
            "send_order_status_push_notification",
        ) as mock_push,
        patch.object(
            backend_module,
            "safe_emit_order_update",
        ) as mock_emit,
    ):
        mock_stalls.find.return_value = [
            {"_id": "stall_a"}
        ]

        mock_orders.find_one.return_value = order

        # Simulate a conditional database update that
        # no longer matches the expected previous status.
        mock_orders.update_one.return_value.matched_count = 0

        response = client.put(
            "/vendor/orders/12346/status",
            params={"stall_id": "stall_a"},
            json={"status": "Accepted"},
        )

        assert response.status_code == 409, response.text
        assert "Concurrent update" in response.json()["detail"]

        mock_orders.update_one.assert_called_once()
        mock_push.assert_not_called()
        mock_emit.assert_not_called()


def test_pickup_rejects_invalid_code(
    client, backend_module, authenticated_user
):
    authenticated_user({
        "email": "vendor_a@test.com",
        "role": "VENDOR",
    })

    order = {
        "_id": "pickup-test-1",
        "token": 12347,
        "pickup_code": "1234",
        "stall_orders": [
            {
                "stall_id": "stall_a",
                "status": "Ready For Pickup",
                "picked_up": False,
            }
        ],
    }

    with (
        patch.object(backend_module, "stalls_collection") as mock_stalls,
        patch.object(backend_module, "orders_collection") as mock_orders,
    ):
        mock_stalls.find.return_value = [{"_id": "stall_a"}]
        mock_orders.find_one.return_value = order

        response = client.post(
            "/vendor/orders/12347/pickup-confirm",
            params={
                "stall_id": "stall_a",
                "pickup_code": "9999",
            },
        )

        assert response.status_code == 403, response.text
        assert response.json()["detail"] == "Invalid pickup code."
        mock_orders.update_one.assert_not_called()


def test_pickup_rejects_unowned_stall(
    client, backend_module, authenticated_user
):
    authenticated_user({
        "email": "vendor_a@test.com",
        "role": "VENDOR",
    })

    with (
        patch.object(backend_module, "stalls_collection") as mock_stalls,
        patch.object(backend_module, "orders_collection") as mock_orders,
    ):
        mock_stalls.find.return_value = [{"_id": "stall_a"}]

        response = client.post(
            "/vendor/orders/12347/pickup-confirm",
            params={
                "stall_id": "stall_b",
                "pickup_code": "1234",
            },
        )

        assert response.status_code == 403, response.text
        mock_orders.find_one.assert_not_called()
        mock_orders.update_one.assert_not_called()


def test_pickup_uses_atomic_stall_filter(
    client, backend_module, authenticated_user
):
    authenticated_user({
        "email": "vendor_a@test.com",
        "role": "VENDOR",
    })

    order = {
        "_id": "pickup-test-2",
        "token": 12348,
        "pickup_code": "1234",
        "stall_orders": [
            {
                "stall_id": "stall_a",
                "status": "Ready For Pickup",
                "picked_up": False,
            },
            {
                "stall_id": "stall_b",
                "status": "Cooking",
                "picked_up": False,
            },
        ],
    }

    async def fake_emit(_order):
        return None

    with (
        patch.object(backend_module, "stalls_collection") as mock_stalls,
        patch.object(backend_module, "orders_collection") as mock_orders,
        patch.object(backend_module, "safe_emit_order_update", fake_emit),
    ):
        mock_stalls.find.return_value = [{"_id": "stall_a"}]
        mock_orders.find_one.return_value = order
        mock_orders.update_one.return_value.matched_count = 1

        response = client.post(
            "/vendor/orders/12348/pickup-confirm",
            params={
                "stall_id": "stall_a",
                "pickup_code": "1234",
            },
        )

        assert response.status_code == 200, response.text
        assert response.json()["success"] is True

        query = mock_orders.update_one.call_args.args[0]
        update = mock_orders.update_one.call_args.args[1]

        assert query["stall_orders"]["$elemMatch"] == {
            "stall_id": "stall_a",
            "status": "Ready For Pickup",
            "picked_up": {"$ne": True},
        }

        assert update["$set"]["stall_orders.$.picked_up"] is True


def test_pickup_duplicate_does_not_write(
    client, backend_module, authenticated_user
):
    authenticated_user({
        "email": "vendor_a@test.com",
        "role": "VENDOR",
    })

    order = {
        "_id": "pickup-test-3",
        "token": 12349,
        "pickup_code": "1234",
        "stall_orders": [
            {
                "stall_id": "stall_a",
                "status": "Ready For Pickup",
                "picked_up": True,
            }
        ],
    }

    with (
        patch.object(backend_module, "stalls_collection") as mock_stalls,
        patch.object(backend_module, "orders_collection") as mock_orders,
    ):
        mock_stalls.find.return_value = [{"_id": "stall_a"}]
        mock_orders.find_one.return_value = order

        response = client.post(
            "/vendor/orders/12349/pickup-confirm",
            params={
                "stall_id": "stall_a",
                "pickup_code": "1234",
            },
        )

        assert response.status_code == 200, response.text
        assert response.json()["duplicate"] is True
        mock_orders.update_one.assert_not_called()
