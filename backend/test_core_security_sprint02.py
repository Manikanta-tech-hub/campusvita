"""Isolated Sprint 01/02 authorization and order-integrity regression tests."""

from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import jwt
import pytest
from fastapi import HTTPException


def run_immediate(coroutine):
    """Drive coroutines whose dependencies are immediate mocks."""
    try:
        coroutine.send(None)
    except StopIteration as completed:
        return completed.value
    raise AssertionError("Coroutine unexpectedly blocked in an isolated test")


def test_expired_access_token_is_rejected(backend_module):
    token = jwt.encode(
        {
            "email": "student@example.com",
            "type": "access",
            "exp": datetime.now(timezone.utc) - timedelta(minutes=1),
        },
        backend_module.JWT_SECRET,
        algorithm=backend_module.JWT_ALGORITHM,
    )

    with pytest.raises(HTTPException) as error:
        backend_module.verify_token(token)

    assert error.value.status_code == 401
    assert error.value.detail == "Invalid or expired token"


def test_admin_role_cannot_be_bypassed(backend_module):
    checker = backend_module.require_role(backend_module.UserRole.ADMIN)

    with pytest.raises(HTTPException) as error:
        checker({"email": "student@example.com", "role": "USER"})

    assert error.value.status_code == 403


def test_legacy_global_status_route_requires_admin(backend_module):
    route = next(
        route
        for route in backend_module.fastapi_app.routes
        if getattr(route, "path", None) == "/update-order-status/{order_id}"
    )
    dependency = route.dependant.dependencies[0]
    checker = dependency.call

    with pytest.raises(HTTPException) as error:
        checker({"email": "student@example.com", "role": "USER"})

    assert error.value.status_code == 403


def test_fcm_token_uses_authenticated_email_only(backend_module):
    users = MagicMock()
    users.update_one.return_value = SimpleNamespace(matched_count=1)
    payload = backend_module.FCMTokenData(fcm_token="device-token")

    with patch.object(backend_module, "users_collection", users):
        result = backend_module.save_fcm_token(
            payload,
            {"email": "student@example.com", "role": "USER"},
        )

    assert result["message"] == "FCM token saved successfully"
    users.update_one.assert_called_once_with(
        {"email": "student@example.com"},
        {"$set": {"fcm_token": "device-token"}},
    )


def test_cart_summary_passes_stall_identity_to_authoritative_pricer(
    backend_module,
):
    bill = {
        "items": [{"name": "Rice", "stall_id": "stall-a", "price": 80}],
        "subtotal": 80.0,
        "delivery_fee": 20.0,
        "tax_amount": 0.0,
        "discount": 0.0,
        "total": 100.0,
    }
    request = backend_module.CartSummaryRequest(
        items=[
            backend_module.CartSummaryItem(
                name="Rice",
                quantity=1,
                stall_id="stall-a",
            )
        ]
    )

    with patch.object(
        backend_module,
        "calculate_food_order_bill",
        return_value=bill,
    ) as calculate:
        result = backend_module.get_cart_summary(request)

    assert result["total"] == 100.0
    passed_items = calculate.call_args.args[0]
    assert passed_items[0].stall_id == "stall-a"
    assert passed_items[0].quantity == 1


def test_duplicate_online_payment_stops_before_provider_or_order_write(
    backend_module,
):
    request = backend_module.VerifyPaymentData(
        razorpay_payment_id="pay_duplicate",
        razorpay_order_id="order_duplicate",
        razorpay_signature="signature",
        order_intent="intent",
    )
    intent = {
        "email": "student@example.com",
        "razorpay_order_id": "order_duplicate",
    }
    payments = MagicMock()
    payments.find_one.return_value = {"payment_id": "pay_duplicate"}

    with (
        patch.object(backend_module, "decode_signed_intent", return_value=intent),
        patch.object(backend_module, "payments_collection", payments),
        patch.object(backend_module.razorpay_client.utility, "verify_payment_signature") as verify,
        patch.object(backend_module, "orders_collection") as orders,
    ):
        with pytest.raises(HTTPException) as error:
            run_immediate(
                backend_module.verify_payment(
                    request,
                    {"email": "student@example.com", "role": "USER"},
                )
            )

    assert error.value.status_code == 400
    assert error.value.detail == "Payment already processed"
    verify.assert_not_called()
    orders.insert_one.assert_not_called()


def test_vendor_cannot_access_other_vendor_stall(backend_module):
    stalls = MagicMock()
    stalls.find.return_value = [{"_id": "stall-a"}]

    with patch.object(backend_module, "stalls_collection", stalls):
        allowed = backend_module.get_vendor_stall_ids(
            {"email": "vendor-a@example.com", "role": "VENDOR"}
        )

    assert allowed == ["stall-a"]


def test_wrong_role_cannot_resolve_vendor_stalls(backend_module):
    with pytest.raises(HTTPException) as error:
        backend_module.get_vendor_stall_ids(
            {"email": "student@example.com", "role": "USER"}
        )

    assert error.value.status_code == 403


def test_duplicate_pickup_is_idempotent_and_does_not_write(backend_module):
    order = {
        "_id": "order-1",
        "token": 1001,
        "pickup_code": "1234",
        "stall_orders": [
            {
                "stall_id": "stall-a",
                "status": backend_module.StallOrderStatus.READY,
                "picked_up": True,
            }
        ],
    }
    stalls = MagicMock()
    stalls.find.return_value = [{"_id": "stall-a"}]
    orders = MagicMock()
    orders.find_one.return_value = order

    with (
        patch.object(backend_module, "stalls_collection", stalls),
        patch.object(backend_module, "orders_collection", orders),
    ):
        result = run_immediate(
            backend_module.confirm_pickup(
                1001,
                "stall-a",
                "1234",
                {"email": "vendor@example.com", "role": "VENDOR"},
            )
        )

    assert result["duplicate"] is True
    orders.update_one.assert_not_called()
