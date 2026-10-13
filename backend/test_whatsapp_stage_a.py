"""Stage A — webhook receipt processing tests."""
import unittest, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from whatsapp_webhook_endpoint import _extract_status_updates, webhook_endpoint
import json


class WebhookReceiptTests(unittest.TestCase):
    def test_extract_status_updates_valid(self):
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
        self.assertEqual(updates[0]["status"], "delivered")

    def test_extract_malformed_safe(self):
        self.assertEqual(_extract_status_updates({}), [])
        self.assertEqual(_extract_status_updates({"entry": [{}]}), [])

if __name__ == "__main__":
    unittest.main(verbosity=2)
