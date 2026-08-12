"use client";

import { ChevronDown } from "lucide-react";

export default function UserMenu() {
  return (
    <button
      className="
      flex
      items-center
      gap-3
      rounded-2xl
      border
      border-zinc-800
      bg-zinc-900
      px-3
      py-2
      hover:border-orange-500
      transition
      "
    >
      <div
        className="
        h-10
        w-10
        rounded-full
        bg-orange-500
        flex
        items-center
        justify-center
        font-bold
        "
      >
        A
      </div>

      <div className="text-left hidden md:block">
        <p className="font-semibold">
          Administrator
        </p>

        <p className="text-xs text-zinc-500">
          CampusVita
        </p>
      </div>

      <ChevronDown size={18} />
    </button>
  );
}