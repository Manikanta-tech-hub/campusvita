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
      className={`rounded-2xl border p-4 transition ${
        notification.unread
          ? "border-orange-500/30 bg-orange-500/5"
          : "border-zinc-800 bg-[#17171f]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">

        <div className="min-w-0">

          <p className="text-sm font-semibold text-white">
            {notification.title}
          </p>

          <p className="mt-1 text-sm text-zinc-400">
            {notification.message}
          </p>

          <p className="mt-2 text-xs text-zinc-600">
            {notification.time}
          </p>

        </div>

        {notification.unread && (
          <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-orange-500" />
        )}

      </div>
    </div>
  );
}