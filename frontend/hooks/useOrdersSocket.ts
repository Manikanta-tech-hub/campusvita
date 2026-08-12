"use client";

import { useEffect, useRef } from "react";

export type SocketMessage = {
  event: string;
  data?: any;
};

export default function useOrdersSocket(
  onMessage: (message: SocketMessage) => void
) {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  // Always keep the latest callback
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    mountedRef.current = true;

    const connect = () => {
      if (!mountedRef.current) return;

      // Prevent duplicate connections
      if (
        socketRef.current &&
        (socketRef.current.readyState === WebSocket.OPEN ||
          socketRef.current.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }

      console.log("🔄 Connecting to Orders WebSocket...");

      const socket = new WebSocket(
        "ws://localhost:8000/ws/admin/orders"
      );

      socketRef.current = socket;

      socket.onopen = () => {
        console.log("✅ Orders WebSocket Connected");
      };

      socket.onmessage = (event) => {
        try {
          const message: SocketMessage = JSON.parse(event.data);

          console.log("📨 Orders WebSocket message:", message);

          onMessageRef.current(message);
        } catch (error) {
          console.error(
            "❌ Invalid Orders WebSocket message:",
            event.data,
            error
          );
        }
      };

      socket.onerror = () => {
        console.error(
          "❌ Orders WebSocket connection failed."
        );

        console.error(
          "WebSocket URL:",
          "ws://127.0.0.1:8000/ws/admin/orders"
        );

        console.error(
          "Backend should be running at:",
          "http://127.0.0.1:8000"
        );
      };

      socket.onclose = (event) => {
        console.log(
          "⚠️ Orders WebSocket Closed",
          {
            code: event.code,
            reason: event.reason || "No reason provided",
            wasClean: event.wasClean,
          }
        );

        socketRef.current = null;

        if (!mountedRef.current) return;

        // Don't create multiple reconnect timers
        if (reconnectTimer.current) {
          clearTimeout(reconnectTimer.current);
        }

        reconnectTimer.current = setTimeout(() => {
          reconnectTimer.current = null;
          connect();
        }, 3000);
      };
    };

    connect();

    return () => {
      mountedRef.current = false;

      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }

      if (socketRef.current) {
        socketRef.current.onclose = null;

        if (
          socketRef.current.readyState === WebSocket.OPEN ||
          socketRef.current.readyState === WebSocket.CONNECTING
        ) {
          socketRef.current.close(
            1000,
            "Component unmounted"
          );
        }

        socketRef.current = null;
      }
    };
  }, []);
}