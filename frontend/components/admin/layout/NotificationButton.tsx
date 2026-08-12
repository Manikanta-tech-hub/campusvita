"use client";

import { Bell } from "lucide-react";

export default function NotificationButton() {
  return (
    <button
      className="
      relative
      rounded-2xl
      border
      border-zinc-800
      bg-zinc-900
      p-3
      transition
      hover:border-orange-500
      "
    >
      <Bell size={20} />

      <span
        className="
        absolute
        right-2
        top-2
        h-2
        w-2
        rounded-full
        bg-orange-500
        "
      />
    </button>
  );
}