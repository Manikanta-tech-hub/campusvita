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
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground transition-colors duration-200">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-border border-t-brand" />

          <p className="text-sm text-text-secondary">
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
    <div className="flex min-h-screen w-full items-stretch bg-background text-foreground transition-colors duration-200">
      {/* Sidebar */}
      <div className="hidden w-72 shrink-0 lg:block">
        <Sidebar />
      </div>

      {/* Main Admin Content */}
      <div className="min-w-0 flex-1 bg-background transition-colors duration-200">
        {/* Topbar */}
        <Topbar />

        {/* Page Content */}
        <main className="min-h-[calc(100vh-72px)] bg-background transition-colors duration-200">
          <div className="mx-auto w-full max-w-[1800px] p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}