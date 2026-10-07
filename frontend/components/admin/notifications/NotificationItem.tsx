"use client";

import type { Notification } from "./notifications";

interface NotificationItemProps {
  notification: Notification;
}

export default function NotificationItem({
  notification,
}: NotificationItemProps) {
  return (
    <div
      className={`rounded-2xl border p-4 transition-colors duration-200 ${
        notification.unread
          ? "border-brand/30 bg-brand/5"
          : "border-border bg-surface"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary">
            {notification.title}
          </p>

          <p className="mt-1 text-sm text-text-secondary">
            {notification.message}
          </p>

          <p className="mt-2 text-xs text-text-muted">
            {notification.time}
          </p>
        </div>

        {notification.unread && (
          <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-brand" />
        )}
      </div>
    </div>
  );
}