"use client";

import { Menu } from "lucide-react";

import SearchBar from "./SearchBar";
import UserMenu from "./UserMenu";
import NotificationBell from "@/components/admin/notifications/NotificationBell";

type Props = {
  onMenuClick?: () => void;
};

export default function Topbar({ onMenuClick }: Props) {
  return (
    <header
      className="
        sticky
        top-0
        z-40
        border-b
        border-border
        bg-card/90
        backdrop-blur-xl
        transition-colors
        duration-200
      "
    >
      <div
        className="
          flex
          items-center
          justify-between
          gap-4
          px-4
          py-4
          sm:px-6
          sm:py-5
          lg:px-8
        "
      >
        <div className="flex min-w-0 items-center gap-3">
          {/* Mobile: open sidebar drawer */}

          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              aria-label="Open menu"
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                border
                border-border
                bg-card
                text-text-secondary!
                transition-colors
                duration-200
                hover:border-brand/40
                hover:text-brand!
                lg:hidden
              "
            >
              <Menu size={18} />
            </button>
          )}

          <div className="min-w-0">
            <h1 className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl">
              Dashboard
            </h1>

            <p className="truncate text-sm text-text-secondary">
              Welcome back, Administrator 👋
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden md:block">
            <SearchBar />
          </div>

          <NotificationBell />

          <UserMenu />
        </div>
      </div>
    </header>
  );
}
