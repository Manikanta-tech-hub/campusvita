"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
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
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-orange-500" />
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
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {children}
    </div>
  );
}
