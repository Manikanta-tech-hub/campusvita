"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  getSession,
  clearSession,
} from "@/app/lib/auth/session";

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  // Public entry point: the vendor activation placeholder
  // must be reachable (and render immediately) without a
  // VENDOR session.
  const isPublicRoute = pathname === "/vendor/activate";

  useEffect(() => {
    if (isPublicRoute) {
      return;
    }

    const session = getSession("VENDOR");

    if (!session) {
      clearSession("VENDOR");
      router.replace("/login");
      return;
    }

    if (session.user.role !== "VENDOR") {
      clearSession("VENDOR");
      router.replace("/login");
      return;
    }

    setAuthorized(true);
    setCheckingAuth(false);
  }, [router, isPublicRoute]);

  if (isPublicRoute) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-white">
        {children}
      </div>
    );
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-brand" />
          <p className="text-sm text-zinc-400">
            Checking vendor session...
          </p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-white">
      {children}
    </div>
  );
}
