"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

import CollapsibleSidebar from "@/components/admin/CollapsibleSidebar";
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

  // Sidebar state: desktop collapse + mobile drawer
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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

  // Mobile drawer: close on Escape, lock background scroll
  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;

    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

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

  const closeDrawer = () => setMobileOpen(false);

  return (
    <div className="flex min-h-screen w-full items-stretch bg-background text-foreground transition-colors duration-200">
      {/* ======================================================
          DESKTOP SIDEBAR — single visible implementation
      ====================================================== */}

      <div className="hidden lg:block">
        <CollapsibleSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((value) => !value)}
        />
      </div>

      {/* ======================================================
          MAIN ADMIN CONTENT
      ====================================================== */}

      <div className="min-w-0 flex-1 bg-background transition-colors duration-200">
        {/* Topbar */}
        <Topbar onMenuClick={() => setMobileOpen(true)} />

        {/* Page Content */}
        <main className="min-h-[calc(100vh-72px)] bg-background transition-colors duration-200">
          <div className="mx-auto w-full max-w-[1800px] p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      {/* ======================================================
          MOBILE DRAWER — same sidebar component
      ====================================================== */}

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="admin-mobile-drawer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 lg:hidden"
          >
            <button
              type="button"
              aria-label="Close menu"
              onClick={closeDrawer}
              className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            />

            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl"
            >
              <CollapsibleSidebar
                collapsed={false}
                onToggle={closeDrawer}
                onNavigate={closeDrawer}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
