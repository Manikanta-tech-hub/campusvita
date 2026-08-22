"use client";

import { Bell, LogOut, User } from "lucide-react";
import { clearSession, getSessionUser } from "@/app/lib/auth/session";
import { useEffect, useState } from "react";

export default function Topbar() {
  const [adminName, setAdminName] = useState("Admin");
  const [adminEmail, setAdminEmail] = useState("");

  useEffect(() => {
    const admin = getSessionUser("ADMIN");

    if (admin) {
      setAdminName(admin.name || "Admin");
      setAdminEmail(admin.email || "");
    }
  }, []);

  const handleLogout = () => {
    clearSession("ADMIN");
    window.location.replace("/login");
  };

  return (
    <header className="h-16 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-8">
      <div>
        <h2 className="text-xl font-bold text-white">
          Welcome, {adminName} 👋
        </h2>

        <p className="text-sm text-gray-400">
          Manage your CampusVita system
        </p>
      </div>

      <div className="flex items-center gap-5">
        <button className="relative text-gray-400 hover:text-white transition">
          <Bell size={22} />

          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] flex items-center justify-center">
            3
          </span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
            <User size={18} className="text-white" />
          </div>

          <div className="hidden md:block">
            <p className="font-semibold">{adminName}</p>

            <p className="text-xs text-gray-400">
              {adminEmail || "Campus Administrator"}
            </p>
          </div>
        </div>

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