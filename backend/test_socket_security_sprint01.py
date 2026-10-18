
#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
CampusVita Sprint 01 - Socket.IO Security Tests

Tests:
1. Reject socket connections without authentication.
2. Reject invalid access tokens.
3. Join only the authenticated customer's room.
4. Send order updates only to the correct customer room.
5. Never emit order updates without a customer identity.

Uses the shared backend_module fixture from conftest.py.

MongoDB and Socket.IO operations are mocked where needed.
No production database or Firebase credentials are required.
"""

from unittest.mock import AsyncMock, patch

import pytest

@pytest.fixture
def main(backend_module):
    """Reuse the backend already imported by conftest.py."""
    return backend_module


def run_immediate(coroutine):
    """Drive a coroutine whose collaborators are immediate mocks.

    This avoids creating an OS event loop in the isolated Windows test
    environment, where socket-pair creation is unavailable.
    """
    try:
        coroutine.send(None)
    except StopIteration as completed:
        return completed.value
    raise AssertionError("Coroutine unexpectedly blocked in an isolated test")


# ============================================================
# TEST 1 - REJECT MISSING AUTHENTICATION
# ============================================================

def test_socket_rejects_missing_auth(main):
    """
    Socket connections without an authentication
    payload must be rejected.
    """

    with pytest.raises(ConnectionRefusedError):
        run_immediate(main.connect(
            "test-sid",
            {},
            None,
        ))


# ============================================================
# TEST 2 - REJECT INVALID ACCESS TOKEN
# ============================================================

def test_socket_rejects_invalid_token(main):
    """
    Invalid tokens must not establish a socket connection.
    """

    with patch.object(
        main,
        "verify_token",
        side_effect=ValueError("Invalid token"),
    ):
        with pytest.raises(ConnectionRefusedError):
            run_immediate(main.connect(
                "test-sid",
                {},
                {
                    "token": "invalid-token",
                },
            ))


# ============================================================
# TEST 3 - AUTHENTICATED CUSTOMER ROOM
# ============================================================

def test_socket_joins_only_verified_customer_room(main):
    """
    A socket must join the room belonging to the
    authenticated database user.

    Client-supplied email addresses must not
    determine room membership.
    """

    authenticated_user = {
        "email": "student@example.com",
        "is_active": True,
    }

    verified_payload = {
        "type": "access",
        "email": "student@example.com",
    }

    with (
        patch.object(
            main,
            "verify_token",
            return_value=verified_payload,
        ),
        patch.object(
            main.users_collection,
            "find_one",
            return_value=authenticated_user,
        ),
        patch.object(
            main.sio,
            "enter_room",
            new_callable=AsyncMock,
        ) as enter_room,
    ):
        run_immediate(main.connect(
            "test-sid",
            {},
            {
                "token": "valid-token",
                "email": "attacker@example.com",
            },
        ))

        enter_room.assert_awaited_once_with(
            "test-sid",
            "customer_student@example.com",
        )

        assert (
            "customer_attacker@example.com"
            not in str(enter_room.await_args)
        )


# ============================================================
# TEST 4 - CUSTOMER-SCOPED ORDER EVENT
# ============================================================

def test_order_event_targets_customer_room_only(main):
    """
    Order events must target the owning customer's
    private room.

    Sensitive order information must not appear
    in the emitted payload.
    """

    order = {
        "token": 12345,
        "email": "student@example.com",
        "status": "Cooking",
        "stall_orders": [
            {
                "stall_id": "stall-1",
                "status": "Cooking",
            }
        ],
        "pickup_code": "1234",
        "total_amount": 250,
    }

    with patch.object(
        main.sio,
        "emit",
        new_callable=AsyncMock,
    ) as emit:
        run_immediate(main.safe_emit_order_update(order))

        emit.assert_awaited_once()

        args, kwargs = emit.await_args

        assert args[0] == "order_update"

        assert kwargs["room"] == (
            "customer_student@example.com"
        )

        payload = args[1]

        assert payload["token"] == 12345
        assert payload["status"] == "Cooking"

        assert len(payload["stall_orders"]) == 1

        assert (
            payload["stall_orders"][0]["stall_id"]
            == "stall-1"
        )

        assert (
            payload["stall_orders"][0]["status"]
            == "Cooking"
        )

        assert "pickup_code" not in payload
        assert "total_amount" not in payload
        assert "email" not in payload

        # The event must not be globally broadcast.
        assert kwargs["room"] is not None


# ============================================================
# TEST 5 - MISSING CUSTOMER IDENTITY
# ============================================================

def test_order_event_without_customer_is_not_emitted(main):
    """
    Orders without a customer identity must not
    produce Socket.IO events.
    """

    order = {
        "token": 12345,
        "status": "Cooking",
        "stall_orders": [],
    }

    with patch.object(
        main.sio,
        "emit",
        new_callable=AsyncMock,
    ) as emit:
        run_immediate(main.safe_emit_order_update(order))

        emit.assert_not_awaited()
