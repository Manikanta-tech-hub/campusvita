"""Template payload reference for Meta WhatsApp Manager approval."""
TEMPLATES = {
    "campusvita_order_confirmation": {
        "language": "en_US",
        "components": [{"type": "body", "parameters": [{"type": "text", "text": "{{1}}"}]}],
    },
    "campusvita_order_accepted": {
        "language": "en_US",
        "components": [{"type": "body", "parameters": [{"type": "text", "text": "{{1}}"}]}],
    },
    "campusvita_order_completed_rating": {
        "language": "en_US",
        "components": [{"type": "body", "parameters": [{"type": "text", "text": "{{1}}"}]}],
    },
}
