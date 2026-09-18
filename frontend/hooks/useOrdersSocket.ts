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
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(false);
  const connectingRef = useRef(false);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    mountedRef.current = true;

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const connect = () => {
      if (!mountedRef.current) return;

      if (connectingRef.current) return;

      const existingSocket = socketRef.current;

      if (
        existingSocket &&
        (existingSocket.readyState === WebSocket.OPEN ||
          existingSocket.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }

      const sessionRaw = localStorage.getItem(
        "campusvita_admin_session"
      );

      if (!sessionRaw) {
        console.warn(
          "⚠️ No admin session found. Orders WebSocket will not connect."
        );
        return;
      }

      let session: any;

      try {
        session = JSON.parse(sessionRaw);
      } catch {
        console.error("❌ Invalid admin session.");
        return;
      }

      const token = session?.accessToken;
      const role = session?.user?.role;

      if (!token || role !== "ADMIN") {
        console.warn(
          "⚠️ Valid ADMIN session not found. Orders WebSocket will not connect."
        );
        return;
      }

      const socketUrl = `${WS_URL}/ws/admin/orders`;

      console.log(
        "🔄 Connecting to Orders WebSocket:",
        socketUrl
      );

      connectingRef.current = true;

      const socket = new WebSocket(socketUrl);

      socketRef.current = socket;

      socket.onopen = () => {
        connectingRef.current = false;

        if (!mountedRef.current) {
          socket.close(1000, "Component unmounted");
          return;
        }

        console.log(
          "✅ Orders WebSocket Connected:",
          socketUrl
        );
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
            "❌ Orders WebSocket error:",
            socketUrl
          );
        }
      };

      socket.onclose = (event) => {
        connectingRef.current = false;

        console.log("⚠️ Orders WebSocket Closed", {
          code: event.code,
          reason: event.reason || "No reason provided",
          wasClean: event.wasClean,
        });

        if (socketRef.current === socket) {
          socketRef.current = null;
        }

        if (!mountedRef.current) {
          return;
        }

        clearReconnectTimer();

        reconnectTimerRef.current = setTimeout(() => {
          reconnectTimerRef.current = null;

          if (mountedRef.current) {
            connect();
          }
        }, 3000);
      };
    };

    connect();

    return () => {
      mountedRef.current = false;

      clearReconnectTimer();

      connectingRef.current = false;

      const socket = socketRef.current;

      if (!socket) {
        return;
      }

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
    };
  }, []);
}