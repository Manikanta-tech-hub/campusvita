"use client";

import { ChevronDown } from "lucide-react";

export default function UserMenu() {
  return (
    <button
      type="button"
      className="
        flex
        items-center
        gap-3
        rounded-2xl
        border
        border-border
        bg-card
        px-3
        py-2
        text-text-primary
        transition-all
        duration-200
        hover:border-brand/50
        hover:bg-card-hover
      "
    >
      <div
        className="
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-full
          bg-brand
          font-bold
          text-white
        "
      >
        A
      </div>

      <div className="hidden text-left md:block">
        <p className="font-semibold text-text-primary">
          Administrator
        </p>

        <p className="text-xs text-text-muted">
          CampusVita
        </p>
      </div>

      <ChevronDown
        size={18}
        className="text-text-secondary"
      />
    </button>
  );
}