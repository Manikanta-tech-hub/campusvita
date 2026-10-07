"use client";

import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import NotificationPanel from "./NotificationPanel";
import {
  getAdminNotifications,
  type Notification,
} from "./notifications";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadNotifications() {
    try {
      setLoading(true);

      const data = await getAdminNotifications();

      setNotifications(data);
    } catch (error) {
      console.error(
        "Failed to load notifications:",
        error
      );

      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const unread = notifications.filter(
    (notification) => notification.unread
  ).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Notifications"
        className="
          relative
          rounded-2xl
          border
          border-border
          bg-card
          p-3
          text-text-primary
          shadow-[var(--shadow-soft)]
          transition-all
          duration-200
          hover:border-brand/50
          hover:bg-card-hover
        "
      >
        <Bell
          className="text-text-secondary"
          size={20}
        />

        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <NotificationPanel
          notifications={notifications}
          loading={loading}
          onRefresh={loadNotifications}
        />
      )}
    </div>
  );
}