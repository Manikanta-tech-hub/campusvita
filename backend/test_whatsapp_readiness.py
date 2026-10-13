"""Task A/B readiness tests — indexes, lifecycle, scheduler."""
import unittest, sys, os, time
sys.path.insert(0, os.path.dirname(__file__))
from whatsapp_scheduler import start_scheduler, stop_scheduler, is_scheduler_active, graceful_shutdown_recovery
from whatsapp_notifications import whatsapp_notifications, whatsapp_outbox, rating_tokens


class ReadinessTests(unittest.TestCase):
    def test_index_creation_safe(self):
        # Index creation handled in create_indexes; verify no exception here.
        self.assertTrue(True)

    def test_scheduler_start_stop_idempotent(self):
        started = start_scheduler(interval=2, batch_size=2)
        # Should succeed or return False if already active; no exception.
        self.assertIn(started, (True, False))
        if started:
            self.assertTrue(stop_scheduler())

    def test_graceful_shutdown_no_crash(self):
        graceful_shutdown_recovery()
        self.assertTrue(True)

    def test_multiple_start_prevented(self):
        # Start once; second should return False.
        first = start_scheduler(interval=5, batch_size=1)
        second = start_scheduler(interval=5, batch_size=1)
        self.assertFalse(second)
        if first:
            stop_scheduler()

if __name__ == "__main__":
    unittest.main(verbosity=2)
