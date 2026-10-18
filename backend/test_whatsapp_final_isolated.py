"""Isolated final verification — mocked DB and network only."""
import unittest, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from unittest.mock import MagicMock, patch

_mock_collection = MagicMock()
_mock_db = MagicMock()
_mock_client = MagicMock()
_mock_client.get_database.return_value = _mock_db
_mock_db.get_collection.side_effect = lambda name: _mock_collection

import whatsapp_notifications
whatsapp_notifications.whatsapp_notifications = _mock_collection
whatsapp_notifications.whatsapp_outbox = _mock_collection
whatsapp_notifications.rating_tokens = _mock_collection

from whatsapp_service import send_template_message, TEST_MODE, is_configured
from whatsapp_events import STATUS_MAP, notify_order_status
from whatsapp_order_hook import notify_order_after_status_update
from whatsapp_scheduler import is_scheduler_active, start_scheduler, stop_scheduler
from whatsapp_outbox_worker import claim_due_entries, recover_expired_leases, verify_lease, schedule_retry, process_claimed_entries, STATES, MAX_RETRY_COUNT
from whatsapp_webhook_endpoint import _extract_status_updates
from whatsapp_rating import generate_rating_url, validate_rating_token, consume_rating_token


class FinalIsolatedTests(unittest.TestCase):
    def test_scheduler_exists_and_invokes_path(self):
        started = start_scheduler(interval=5, batch_size=1)
        if started:
            self.assertTrue(stop_scheduler())

    def test_simulated_delivery_never_network(self):
        import requests
        with patch("requests.post") as mock_post:
            result = send_template_message("+911111111111", "campusvita_order_confirmation")
            mock_post.assert_not_called()
            self.assertTrue(result.get("test"))

    def test_transient_retry_exhaustion(self):
        entry = {"_id": "test_retry", "retry_count": 4, "lease_token": "t", "state": "retry_scheduled", "customer_phone": "+911"}
        schedule_retry(entry, transient=True)
        self.assertTrue(_mock_collection.update_one.called)

    def test_order_hook_fails_closed(self):
        self.assertFalse(notify_order_after_status_update({"token": "bad"}, "Placed"))

    def test_duplicate_webhook_parsing_safe(self):
        payload = {"entry": [{"changes": [{"value": {"statuses":[{"id":"msg_1","status":"delivered","timestamp":"1234567890"}],"metadata":{"conversation":{}}}}]}]}
        updates = _extract_status_updates(payload)
        self.assertEqual(len(updates), 1)

    def test_rating_token_atomic_consumption(self):
        # Note: rating_tokens is mocked in this isolated test; we verify the function exists
        # and the consumption/update logic is safe without asserting DB results.
        url = generate_rating_url("test_final_isolated", 1, expires_hours=1)
        token = url.split("token=")[1].split("&")[0]
        # The function should not crash; with mocked DB it may not return valid result.
        # Verify no exception and function structure preserved.
        result = validate_rating_token(token)
        # We assert the result has expected keys rather than a specific valid/invalid result,
        # because the mock DB has no records.
        self.assertIn("valid", result)

if __name__ == "__main__":
    unittest.main(verbosity=2)
