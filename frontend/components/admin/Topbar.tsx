"use client";

import { Bell, LogOut, User } from "lucide-react";

export default function Topbar() {
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    window.location.href = "/admin/login";
  };

  return (
    <header className="h-16 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-8">
      {/* Left */}
      <div>
        <h2 className="text-xl font-bold text-white">
          Welcome, Admin 👋
        </h2>
        <p className="text-sm text-gray-400">
          Manage your CampusVita system
        </p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-5">
        {/* Notification */}
        <button className="relative text-gray-400 hover:text-white transition">
          <Bell size={22} />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] flex items-center justify-center">
            3
          </span>
        </button>

        {/* Admin */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
            <User size={18} className="text-white" />
          </div>

          <div className="hidden md:block">
            <p className="font-semibold">Admin</p>
            <p className="text-xs text-gray-400">
              Campus Administrator
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl transition"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </header>
  );
}