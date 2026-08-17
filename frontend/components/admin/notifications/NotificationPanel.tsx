"use client";

import {
  RefreshCw,
} from "lucide-react";

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
    <div className="absolute right-0 top-14 z-50 w-96 rounded-3xl border border-white/10 bg-[#12131A] p-5 shadow-2xl">

      <div className="mb-5 flex items-center justify-between gap-3">

        <h2 className="text-lg font-semibold text-white">
          Notifications
        </h2>

        <div className="flex items-center gap-2">

          {unread > 0 && (
            <span className="rounded-full bg-orange-500 px-3 py-1 text-xs text-white">
              {unread} New
            </span>
          )}

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="rounded-xl p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white disabled:opacity-50"
            title="Refresh notifications"
          >
            <RefreshCw
              size={16}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />
          </button>

        </div>

      </div>

      <div className="max-h-[420px] space-y-3 overflow-y-auto">

        {loading && notifications.length === 0 ? (
          <div className="py-10 text-center text-sm text-zinc-500">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm font-medium text-zinc-300">
              No notifications
            </p>

            <p className="mt-1 text-xs text-zinc-600">
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