"use client";

import SearchBar from "./SearchBar";
import UserMenu from "./UserMenu";
import NotificationBell from "@/components/admin/notifications/NotificationBell";

export default function Topbar() {
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
          gap-6
          px-8
          py-5
        "
      >
        <div>
          <h1 className="text-3xl font-bold text-text-primary">
            Dashboard
          </h1>

          <p className="text-sm text-text-secondary">
            Welcome back, Administrator 👋
          </p>
        </div>

        <div className="flex items-center gap-4">
          <SearchBar />

          <NotificationBell />

          <UserMenu />
        </div>
      </div>
    </header>
  );
}