=== CAMPUSVITA WhatsApp Promotional Messaging — Added ===
Files added/modified safely:
- whatsapp_promo_consent.py (new): consent tracking, opt-out, fail-closed
- whatsapp_promo_campaign.py (new): campaign lifecycle, monthly max 2 limit (configurable via WHATSAPP_CAMPAIGN_MAX_PER_MONTH), draft/approve/cancel
- test_whatsapp_promo.py (new): 8 isolated tests (consent, opt-out, monthly limit, campaign approve/cancel, missing recipient, duplicate suppression)
- .env unchanged; WHATSAPP_TEST_MODE=true preserved; no scheduler enabled

Reuse of existing architecture:
- Existing whatsapp_service adapter reused (TEST_MODE gate preserved)
- Existing whatsapp_outbox / scheduler / webhook endpoint reused (not modified for promotional branch except through consent gate)
- Database collections: users (consent fields added via update), new promo_campaigns

Features completed:
- Promotional campaign independent of orders
- Explicit consent storage (consent bool, timestamp, source, withdrawn_at)
- Monthly limit server-side enforced
- Campaign states: draft -> approved -> scheduled; cancel prevents submission
- Fail-closed for missing consent or invalid recipient linkage
- Opt-out suppresses future sends
- Tests pass (8/8)

Tests executed: python -m unittest test_whatsapp_promo -v -> OK (8 tests, 0.003s)
No real messages sent. No DB mutations against live DB. No indexes created.

Remaining production blockers:
- consent fields (whatsapp_promo_consent) not persisted in user schema yet; requires safe DB rollout
- Real webhook URL / Meta business verification not configured
- Template approval from Meta required for promotional templates
- Receiver identity linking mechanism needs confirmation (email-to-phone mapping)
- Index rollout for promo_campaigns / consent queries required on live DB with authorization

Next steps to test safely:
1. Confirm user model migration adds optional consent fields
2. Register Meta webhook URL with real verify token
3. Approve promotional templates in Meta dashboard
4. Execute index rollout only after authorization and conflict check
5. Run full isolated tests again after any schema changes
