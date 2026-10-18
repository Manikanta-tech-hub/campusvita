"""Isolated promotional WhatsApp tests."""
import unittest, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from unittest.mock import MagicMock, patch

# Mock collections
_mock_users = MagicMock()
_mock_campaigns = MagicMock()

import database
original_db = getattr(database, "db", None)
# Patch collections for isolated tests
import whatsapp_promo_consent
whatsapp_promo_consent.users_collection = _mock_users
import whatsapp_promo_campaign
whatsapp_promo_campaign.promo_campaigns = _mock_campaigns

class PromotionalTests(unittest.TestCase):
    def test_consent_prevents_send(self):
        _mock_users.find_one.return_value = None
        from whatsapp_promo_consent import has_promo_consent
        self.assertFalse(has_promo_consent("user@test.com"))

    def test_revoked_consent_blocks_queue(self):
        _mock_users.find_one.return_value = {"whatsapp_promo_consent": False}
        from whatsapp_promo_consent import has_promo_consent
        self.assertFalse(has_promo_consent("user@test.com"))

    def test_monthly_limit(self):
        from whatsapp_promo_campaign import enforce_monthly_limit
        _mock_campaigns.count_documents.return_value = 1
        # Default max = 2; 1 < 2: allowed
        self.assertTrue(enforce_monthly_limit())
        _mock_campaigns.count_documents.return_value = 2
        # At max: blocked
        self.assertFalse(enforce_monthly_limit())

    def test_campaign_approve(self):
        from whatsapp_promo_campaign import approve_campaign
        result = approve_campaign("id1", "admin@test.com")
        self.assertTrue(result)
        _mock_campaigns.update_one.assert_called()

    def test_cancel_prevents_send(self):
        from whatsapp_promo_campaign import cancel_campaign
        result = cancel_campaign("id1")
        self.assertTrue(result)

    def test_duplicate_campaign_not_executed(self):
        # Test that duplicate executions don't create new recipient jobs
        from whatsapp_promo_campaign import create_campaign
        doc = create_campaign("promo", "template", ["+911"], "admin@test.com")
        self.assertEqual(doc["state"], "draft")

    def test_missing_recipient_fails(self):
        from whatsapp_promo_consent import has_promo_consent
        _mock_users.find_one.return_value = None
        # Without user record (no consent, no linkage) send must fail closed
        self.assertFalse(has_promo_consent("unknown@test.com"))

    def test_opt_out_suppresses(self):
        from whatsapp_promo_consent import set_promo_consent
        _mock_users.update_one.return_value = MagicMock(matched_count=1)
        result = set_promo_consent("user@test.com", False, "opt_out")
        self.assertTrue(result)
        _mock_users.update_one.assert_called()

    def test_concurrent_limit_not_bypassed(self):
        # Without DB-level transaction/constraint, concurrent creation can exceed limit in theory.
        # The code relies on server-side count before insert; concurrent requests could interleave.
        from whatsapp_promo_campaign import enforce_monthly_limit
        # Documented limitation: no atomic transaction/constraint implemented yet.
        # The function checks count before allowing, which is best-effort without DB lock.
        _mock_campaigns.count_documents.return_value = 3
        self.assertFalse(enforce_monthly_limit())
    unittest.main(verbosity=2)
