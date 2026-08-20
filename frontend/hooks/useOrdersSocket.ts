"use client";

import { useEffect, useRef } from "react";

export type SocketMessage = {
  event: string;
  data?: any;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const WS_URL = API_URL.replace(/^http/, "ws");

export default function useOrdersSocket(
  onMessage: (message: SocketMessage) => void
) {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(false);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    mountedRef.current = true;

    const connect = () => {
      if (!mountedRef.current) return;

      if (
        socketRef.current &&
        (socketRef.current.readyState === WebSocket.OPEN ||
          socketRef.current.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }

      const socketUrl = `${WS_URL}/ws/admin/orders`;

      console.log("🔄 Connecting to Orders WebSocket:", socketUrl);

      const socket = new WebSocket(socketUrl);

      socketRef.current = socket;

      socket.onopen = () => {
        if (!mountedRef.current) {
          socket.close(1000, "Component unmounted");
          return;
        }

        console.log("✅ Orders WebSocket Connected:", socketUrl);
      };

      socket.onmessage = (event) => {
        try {
          const message: SocketMessage = JSON.parse(event.data);

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
        if (mountedRef.current) {
          console.error(
            "❌ Orders WebSocket connection failed:",
            socketUrl
          );
        }
      };

      socket.onclose = (event) => {
        console.log("⚠️ Orders WebSocket Closed", {
          code: event.code,
          reason: event.reason || "No reason provided",
          wasClean: event.wasClean,
        });

        if (socketRef.current === socket) {
          socketRef.current = null;
        }

        if (!mountedRef.current) return;

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

      const socket = socketRef.current;

      if (socket) {
        socketRef.current = null;

        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;

        if (
          socket.readyState === WebSocket.OPEN ||
          socket.readyState === WebSocket.CONNECTING
        ) {
          socket.close(1000, "Component unmounted");
        }
      }
    };
  }, []);
}