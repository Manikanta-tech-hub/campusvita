"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Sidebar from "@/components/admin/layout/Sidebar";
import Topbar from "@/components/admin/layout/Topbar";

import {
  getSession,
  clearSession,
} from "@/app/lib/auth/session";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const session = getSession("ADMIN");

    // No ADMIN session
    if (!session) {
      clearSession("ADMIN");
      router.replace("/login");
      return;
    }

    // Make sure the stored session really belongs to ADMIN
    if (session.user.role !== "ADMIN") {
      clearSession("ADMIN");
      router.replace("/login");
      return;
    }

    setAuthorized(true);
    setCheckingAuth(false);
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-orange-500" />
          <p className="text-sm text-zinc-400">
            Checking admin session...
          </p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0f] text-white">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <Topbar />

        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}