"""Phase 1 outbox retry tests."""
import unittest, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from whatsapp_outbox_worker import STATES, claim_due_entries, schedule_retry, MAX_RETRY_COUNT, recover_expired_leases, verify_lease
from whatsapp_events import record_notification
from whatsapp_notifications import whatsapp_outbox, whatsapp_notifications


class OutboxPhase1Tests(unittest.TestCase):
    def test_states_defined(self):
        self.assertIn("pending", STATES)
        self.assertIn("dead_letter", STATES)

    def test_retry_max(self):
        self.assertEqual(MAX_RETRY_COUNT, 4)

    def test_claim_no_crash(self):
        if whatsapp_outbox is not None:
            whatsapp_outbox.delete_many({"order_id": "test_claim"})
        result = claim_due_entries()
        self.assertIsInstance(result, list)

    def test_recover_expired_leases(self):
        count = recover_expired_leases()
        self.assertIsInstance(count, int)

    def test_lease_verification(self):
        from whatsapp_events import record_notification
        if whatsapp_outbox is not None:
            whatsapp_outbox.delete_many({"order_id": "test_lease"})
            record_notification("test_lease", "Placed")
            doc = whatsapp_outbox.find_one({"order_id": "test_lease"})
            token = doc.get("lease_token") if doc else None
            self.assertTrue(verify_lease(doc, token) if doc else False)
            self.assertFalse(verify_lease(doc, "bad_token") if doc else True)
            whatsapp_outbox.delete_many({"order_id": "test_lease"})

if __name__ == "__main__":
    unittest.main(verbosity=2)
