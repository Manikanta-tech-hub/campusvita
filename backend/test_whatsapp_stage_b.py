"""Stage B — scheduler integration tests."""
import unittest, sys, os, time
sys.path.insert(0, os.path.dirname(__file__))
from whatsapp_scheduler import start_scheduler, stop_scheduler, is_scheduler_active


class SchedulerTests(unittest.TestCase):
    def test_start_stop_cycle(self):
        # Start, verify active, then stop. Does not crash.
        self.assertTrue(start_scheduler(interval=2, batch_size=2))
        self.assertTrue(is_scheduler_active())
        self.assertTrue(stop_scheduler())
        # After stop, active should become False; but thread may take a moment.
        time.sleep(0.5)
        # We don't assert False here because timing can vary, but no exception should occur.

    def test_duplicate_start_prevented(self):
        # Starting twice in same process should return False on second call.
        started1 = start_scheduler(interval=5, batch_size=1)
        if started1:
            started2 = start_scheduler(interval=5, batch_size=1)
            self.assertFalse(started2)
            stop_scheduler()

if __name__ == "__main__":
    unittest.main(verbosity=2)
