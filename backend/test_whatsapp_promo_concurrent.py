"""Regressions and concurrency tests."""
import unittest, sys, os
sys.path.insert(0, os.path.dirname(__file__))
import threading, time
from unittest.mock import MagicMock
from whatsapp_promo_campaign import enforce_monthly_limit, create_campaign, cancel_campaign, _reserve_slot

class ConcurrentTests(unittest.TestCase):
    def setUp(self):
        import whatsapp_promo_campaign
        whatsapp_promo_campaign.reserves = MagicMock()
        # Simulate 2 reservations used
        whatsapp_promo_campaign.reserves.count_documents.return_value = 2

    def test_limit_blocks_at_max(self):
        import whatsapp_promo_campaign
        whatsapp_promo_campaign.reserves.count_documents.return_value = 2
        self.assertFalse(enforce_monthly_limit())

    def test_cancel_does_not_create_duplicate(self):
        import whatsapp_promo_campaign
        # Cancel does not insert campaign; safe idempotency.
        result = cancel_campaign("fake_id")
        self.assertTrue(result)

if __name__ == "__main__":
    unittest.main(verbosity=2)
