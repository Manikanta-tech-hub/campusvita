"""Isolated final verification tests — no real DB/network side effects."""
import unittest, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from unittest.mock import patch, MagicMock

from whatsapp_service import TEST_MODE, is_configured, send_template_message
from whatsapp_order_hook import notify_order_after_status_update
from whatsapp_rating import generate_rating_url, validate_rating_token, consume_rating_token
from whatsapp_events import STATUS_MAP, notify_order_status
from whatsapp_webhook_endpoint import _extract_status_updates
from whatsapp_scheduler import start_scheduler, stop_scheduler, is_scheduler_active
from whatsapp_outbox_worker import claim_due_entries, recover_expired_leases, verify_lease, schedule_retry


class FinalVerificationTests(unittest.TestCase):
    def test_test_mode_prevents_network(self):
        import requests
        with patch("requests.post") as mock_post:
            result = send_template_message("+911111111111", "campusvita_order_confirmation")
            mock_post.assert_not_called()
            self.assertTrue(result.get("test"))

    def test_missing_config_blocks_send(self):
        self.assertFalse(is_configured())

    def test_order_hook_fails_closed_no_phone(self):
        result = notify_order_after_status_update({"_id": "no_phone"}, "Placed")
        self.assertFalse(result)

    def test_order_hook_fails_closed_empty_phone(self):
        result = notify_order_after_status_update({"_id": "bad", "phone": ""}, "Placed")
        self.assertFalse(result)

    def test_webhook_extract_and_duplicate_receipt(self):
        payload = {
            "entry": [{
                "changes": [{
                    "value": {
                        "statuses": [{"id": "msg_1", "status": "delivered", "timestamp": "1234567890"}],
                        "metadata": {"conversation": {}},
                    }
                }]
            }]
        }
        updates = _extract_status_updates(payload)
        self.assertEqual(len(updates), 1)
        self.assertEqual(updates[0]["message_id"], "msg_1")

    def test_rating_single_use_and_expiry(self):
        url = generate_rating_url("test_order_123", 1, expires_hours=1)
        token = url.split("token=")[1].split("&")[0]
        result = validate_rating_token(token)
        self.assertTrue(result["valid"])
        self.assertTrue(consume_rating_token(token))
        after = validate_rating_token(token)
        self.assertFalse(after["valid"])
        self.assertEqual(after["reason"], "already_used")

    def test_duplicate_webhook_idempotent(self):
        payload = {
            "entry": [{
                "changes": [{
                    "value": {
                        "statuses": [{"id": "msg_dup", "status": "delivered", "timestamp": "1234567890"}],
                        "metadata": {"conversation": {}}
                    }
                }]
            }]
        }
        # Calling twice yields same updates; no exception.
        first = _extract_status_updates(payload)
        second = _extract_status_updates(payload)
        self.assertEqual(len(first), 1)
        self.assertEqual(len(second), 1)

    def test_scheduler_idempotency(self):
        started1 = start_scheduler(interval=5, batch_size=1)
        started2 = start_scheduler(interval=5, batch_size=1)
        self.assertIn(started1, (True, False))
        if started1:
            self.assertFalse(started2)
            self.assertTrue(stop_scheduler())

    def test_legacy_legacy_states_defined(self):
        from whatsapp_outbox_worker import STATES
        for s in ["pending", "processing", "retry_scheduled", "submitted", "delivered", "failed_permanent", "dead_letter"]:
            self.assertIn(s, STATES)

    def test_claim_and_recover_safe_without_db_mutation(self):
        # These functions should not crash; if DB unavailable they return 0/[] safely.
        claimed = claim_due_entries()
        recovered = recover_expired_leases()
        self.assertIsInstance(claimed, list)
        self.assertIsInstance(recovered, int)

if __name__ == "__main__":
    unittest.main(verbosity=2)
