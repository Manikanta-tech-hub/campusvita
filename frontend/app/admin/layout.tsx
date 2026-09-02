"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

import Sidebar from "@/components/admin/layout/Sidebar";
import Topbar from "@/components/admin/layout/Topbar";

import {
  getSession,
  clearSession,
} from "@/app/lib/auth/session";

function subscribeToSession(callback: () => void) {
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener("storage", callback);
  };
}

function getAdminSessionSnapshot() {
  const session = getSession("ADMIN");

  if (!session) {
    return "NO_SESSION";
  }

  if (session.user.role !== "ADMIN") {
    return "INVALID_SESSION";
  }

  return "AUTHORIZED";
}

function getServerSessionSnapshot() {
  return "CHECKING";
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const authStatus = useSyncExternalStore(
    subscribeToSession,
    getAdminSessionSnapshot,
    getServerSessionSnapshot
  );

  useEffect(() => {
    if (
      authStatus === "NO_SESSION" ||
      authStatus === "INVALID_SESSION"
    ) {
      clearSession("ADMIN");
      router.replace("/login");
    }
  }, [authStatus, router]);

  if (authStatus === "CHECKING") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] text-white">
        <div className="flex flex-col items-center justify-center">
          <div className="mb-4 h-9 w-9 animate-spin rounded-full border-2 border-zinc-700 border-t-orange-500" />

          <p className="text-sm text-zinc-400">
            Checking admin session...
          </p>
        </div>
      </div>
    );
  }

  if (
    authStatus === "NO_SESSION" ||
    authStatus === "INVALID_SESSION"
  ) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full items-stretch bg-[#0a0a0f] text-white">
      {/* Admin Sidebar */}
      <aside className="hidden w-72 shrink-0 lg:flex">
        <Sidebar />
      </aside>

      {/* Main Admin Area */}
      <div className="min-w-0 flex-1 bg-[#0a0a0f]">
        {/* Topbar */}
        <div className="sticky top-0 z-40">
          <Topbar />
        </div>

        {/* Page */}
        <main className="bg-[#0a0a0f]">
          <div className="mx-auto w-full max-w-[1800px] p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}