"use client";

import NotificationItem from "./NotificationItem";
import { notifications } from "./notifications";

export default function NotificationPanel() {
  return (
    <div className="absolute right-0 top-14 z-50 w-96 rounded-3xl border border-white/10 bg-[#12131A] p-5 shadow-2xl">

      <div className="mb-5 flex items-center justify-between">

        <h2 className="text-lg font-semibold text-white">
          Notifications
        </h2>

        <span className="rounded-full bg-orange-500 px-3 py-1 text-xs text-white">
          {notifications.filter((n) => n.unread).length} New
        </span>

      </div>

      <div className="space-y-3 max-h-[420px] overflow-y-auto">

        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
          />
        ))}

      </div>

    </div>
  );
}