"use client";

import { RefreshCw } from "lucide-react";

import NotificationItem from "./NotificationItem";
import type { Notification } from "./notifications";

interface NotificationPanelProps {
  notifications: Notification[];
  loading: boolean;
  onRefresh: () => void;
}

export default function NotificationPanel({
  notifications,
  loading,
  onRefresh,
}: NotificationPanelProps) {
  const unread = notifications.filter(
    (notification) => notification.unread
  ).length;

  return (
    <div
      className="
        absolute
        right-0
        top-14
        z-50
        w-96
        rounded-3xl
        border
        border-border
        bg-card
        p-5
        text-text-primary
        shadow-[var(--shadow-card)]
        transition-colors
        duration-200
      "
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-text-primary">
          Notifications
        </h2>

        <div className="flex items-center gap-2">
          {unread > 0 && (
            <span className="rounded-full bg-brand px-3 py-1 text-xs font-medium text-white">
              {unread} New
            </span>
          )}

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="
              rounded-xl
              p-2
              text-text-secondary
              transition-all
              duration-200
              hover:bg-card-hover
              hover:text-text-primary
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
            title="Refresh notifications"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
          </button>
        </div>
      </div>

      <div className="max-h-[420px] space-y-3 overflow-y-auto">
        {loading && notifications.length === 0 ? (
          <div className="py-10 text-center text-sm text-text-muted">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm font-medium text-text-secondary">
              No notifications
            </p>

            <p className="mt-1 text-xs text-text-muted">
              New orders and payments will appear here.
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
            />
          ))
        )}
      </div>
    </div>
  );
}