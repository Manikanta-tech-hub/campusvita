"use client";

import { Notification } from "./notifications";

interface Props {
  notification: Notification;
}

export default function NotificationItem({
  notification,
}: Props) {
  return (
    <div
      className={`rounded-2xl border p-4 transition ${
        notification.unread
          ? "border-orange-500/30 bg-orange-500/5"
          : "border-zinc-800 bg-[#17171f]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">

        <div>

          <h4 className="font-semibold text-white">
            {notification.title}
          </h4>

          <p className="mt-1 text-sm text-zinc-400">
            {notification.message}
          </p>

        </div>

        {notification.unread && (
          <span className="mt-1 h-2.5 w-2.5 rounded-full bg-orange-500" />
        )}

      </div>

      <p className="mt-3 text-xs text-zinc-500">
        {notification.time}
      </p>
    </div>
  );
}