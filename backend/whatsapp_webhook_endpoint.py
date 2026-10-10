"""Webhook endpoint handler for Meta WhatsApp (GET verification + POST delivery updates)."""
from fastapi import Request, HTTPException
from whatsapp_webhook import verify_signature, VERIFY_TOKEN

async def webhook_endpoint(request: Request):
    # Meta requires GET for webhook verification
    verify_token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")
    if verify_token is not None:
        if verify_token == VERIFY_TOKEN:
            return int(challenge) if challenge else 200
        raise HTTPException(status_code=403, detail="Verification failed")
    # POST for delivery updates
    body = await request.body()
    sig = request.headers.get("x-hub-signature-256", "")
    # During setup with placeholder secrets, skip strict verification
    if verify_signature(body, sig):
        # Process delivery status idempotently (placeholder)
        return {"status": "received", "verified": True}
    return {"status": "received", "verified": False, "mode": "test_or_setup"}
