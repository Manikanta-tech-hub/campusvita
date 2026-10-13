"""Stage B — safe scheduler integration for outbox worker."""
import time, threading, logging
from whatsapp_outbox_worker import claim_due_entries, recover_expired_leases

logger = logging.getLogger(__name__)
_scheduler_lock = threading.Lock()
_scheduler_active = False
_scheduler_stop = threading.Event()
_interval = 30  # seconds; configurable
_batch_size = 5


def start_scheduler(interval=30, batch_size=5):
    global _scheduler_active, _scheduler_stop, _interval, _batch_size
    with _scheduler_lock:
        if _scheduler_active:
            logger.info("[WhatsApp] Scheduler already active; ignoring duplicate start.")
            return False
        _scheduler_active = True
        _scheduler_stop.clear()
        _interval = interval
        _batch_size = batch_size
    # Start in separate thread only when explicitly called; does not auto-start.
    threading.Thread(target=_scheduler_loop, daemon=True, name="WhatsAppOutboxScheduler").start()
    logger.info("[WhatsApp] Scheduler started (interval=%ss, batch=%s)", interval, batch_size)
    return True


def graceful_shutdown_recovery():
    """Release in-flight claims safely during graceful shutdown; does not force claims back if still valid."""
    try:
        from whatsapp_notifications import whatsapp_outbox
        from whatsapp_outbox_worker import recover_expired_leases
        # Recover any expired leases; live ones stay owned by running worker
        recover_expired_leases()
        logger.info("[WhatsApp] Graceful shutdown recovery completed.")
    except Exception as exc:
        logger.warning("[WhatsApp] Graceful shutdown recovery error: %s", exc)


def stop_scheduler():
    global _scheduler_active
    with _scheduler_lock:
        if not _scheduler_active:
            return False
        _scheduler_stop.set()
        _scheduler_active = False
    graceful_shutdown_recovery()
    logger.info("[WhatsApp] Scheduler stop requested.")
    return True


def is_scheduler_active():
    with _scheduler_lock:
        return _scheduler_active


def _scheduler_loop():
    try:
        while not _scheduler_stop.is_set():
            try:
                recover_expired_leases()
                claimed = claim_due_entries(limit=_batch_size)
                if claimed:
                    try:
                        from whatsapp_outbox_worker import process_claimed_entries
                        # process_claimed_entries claims and processes its own batch; called here to complete path
                        process_claimed_entries()
                    except Exception as exc:
                        logger.warning("[WhatsApp] Process claimed entries error: %s", exc)
            except Exception as exc:
                logger.warning("[WhatsApp] Scheduler worker error: %s", exc)
            # Wait in chunks to respond to stop quickly.
            for _ in range(_interval):
                if _scheduler_stop.is_set():
                    break
                time.sleep(1)
    finally:
        with _scheduler_lock:
            global _scheduler_active
            _scheduler_active = False
