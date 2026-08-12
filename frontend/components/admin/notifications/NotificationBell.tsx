"use client";

import { Bell } from "lucide-react";
import { useState } from "react";
import NotificationPanel from "./NotificationPanel";
import { notifications } from "./notifications";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);

  const unread = notifications.filter(
    (n) => n.unread
  ).length;

  return (
    <div className="relative">

      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-2xl border border-zinc-800 bg-[#17171f] p-3 hover:border-orange-500"
      >
        <Bell className="text-white" size={20} />

        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && <NotificationPanel />}

    </div>
  );
}