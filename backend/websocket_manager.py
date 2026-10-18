from fastapi import WebSocket
from typing import List, Optional
import json

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(
        self,
        websocket: WebSocket,
        subprotocol: Optional[str] = None,
    ):
        await websocket.accept(subprotocol=subprotocol)

        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, event: str, data):
        message = {
            "event": event,
            "data": data,
        }

        disconnected = []

        for connection in self.active_connections:
            try:
                await connection.send_text(
                    json.dumps(message)
                )
            except:
                disconnected.append(connection)

        for connection in disconnected:
            self.disconnect(connection)

manager = ConnectionManager()
