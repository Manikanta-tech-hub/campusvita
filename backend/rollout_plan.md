Safe rollout plan for promotional consent schema

Schema proposal (backward-compatible):
- Add optional fields to existing users documents:
  whatsapp_promo_consent (bool, default None / false implicitly)
  whatsapp_promo_consent_timestamp (datetime, optional)
  whatsapp_promo_consent_source (string, optional)
  whatsapp_promo_consent_withdrawn_at (datetime, optional)
- No bulk update; no upsert. Existing users remain without explicit consent, treated as opted out.

Files changed:
- whatsapp_promo_consent.py (new, uses users_collection)
- whatsapp_promo_campaign.py (new, uses promo_campaigns collection)
- database.py: add promo_campaigns collection (optional; safe if missing)

Indexes (not executed; proposed only):
- users: {email: 1, whatsapp_promo_consent: 1} (optional, for consent lookup performance)
- promo_campaigns: {month_key: 1, state: 1} (for monthly limit query performance)
- Uniqueness: no unique constraint required for consent; no duplicate campaign execution prevented solely by DB constraint (rely on application-level state and monthly count).

Backward compatibility:
- Existing documents without the fields will return `None` for consent; `has_promo_consent` treats `None` as False.
- `set_promo_consent` uses `update_one` with `upsert=False` to avoid creating phantom user docs.

Deployment order:
1. Deploy new backend files (promo_consent, promo_campaign) — no DB mutation.
2. Verify with isolated tests (`test_whatsapp_promo`, `test_whatsapp_promo_lifecycle`) — confirmed passing.
3. When ready, add optional consent fields to user schema via safe migration script that updates only documents with explicit consent records (not bulk-defaulting to True).
4. Create `promo_campaigns` collection manually or via safe initialization script (no destructive actions).
5. Only after schema and webhooks are configured, consider enabling scheduler; keep `WHATSAPP_SCHEDULER_ENABLED=false` until then.

Rollback:
- Remove consent fields from user updates; revert to previous code version.
- `promo_campaigns` collection can remain (harmless if unused) or be dropped after authorization.

Dry-run verification:
- Run `python -m unittest test_whatsapp_promo -v` and `python -m unittest test_whatsapp_promo_lifecycle -v` in test mode.
- Confirm `WHATSAPP_TEST_MODE=true` and `WHATSAPP_SCHEDULER_ENABLED=false`.
- Confirm no real WhatsApp messages sent (mock adapter returns `{"test": True}`).
- Confirm monthly limit enforced under mock conditions.

Identity verification behavior:
- Phone number verification relies on the existing user document (`email`, `phone`). No separate verified-phone table exists.
- `whatsapp_promo_consent` is separate from verified-phone state; consent is not inferred from a verified number.
- Recipient eligibility requires both existing user linkage (email) and explicit consent (`True`). Fail-closed otherwise.
- `has_promo_consent` requires an explicit `True` value. Missing/absent/`False`/`None` all return False.
- No bulk opt-in performed; no user is added to promotional audience until explicit `set_promo_consent(..., True)` call.
