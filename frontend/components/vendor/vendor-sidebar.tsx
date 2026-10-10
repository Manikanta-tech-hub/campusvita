"use client";

import { LogOut, Store, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import type { Dispatch, SetStateAction } from "react";

import {
  Logo,
  Sidebar,
  SidebarBody,
  SidebarContent,
  SidebarFooter,
  SidebarLink,
} from "@/components/ui/sidebar";

import { vendorNavigation } from "./vendor-navigation";

type VendorSidebarProps = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  onLogout: () => void;
};

export default function VendorSidebar({
  open,
  setOpen,
  onLogout,
}: VendorSidebarProps) {
  const pathname = usePathname();

  const links = [
    ...vendorNavigation,
    {
      label: "Profile",
      href: "/vendor/profile",
      icon: UserRound,
    },
  ];

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="border-[var(--border)] bg-[var(--surface)]">
        <Logo open={open} setOpen={setOpen} />

        <SidebarContent>
          <div className="mb-3 px-3 pt-4">
            {open ? (
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 shrink-0 text-[var(--brand)]" />
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                  Vendor Portal
                </span>
              </div>
            ) : (
              <div className="flex justify-center">
                <Store className="h-4 w-4 text-[var(--brand)]" />
              </div>
            )}
          </div>

          <nav aria-label="Vendor navigation" className="space-y-1">
            {links.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href ||
                (item.href !== "/vendor/dashboard" &&
                  pathname.startsWith(`${item.href}/`));

              return (
                <SidebarLink
                  key={item.href}
                  link={{
                    label: item.label,
                    href: item.href,
                    icon: <Icon className="h-5 w-5 shrink-0" />,
                  }}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={
                    active
                      ? "bg-[var(--brand-soft)] font-semibold text-[var(--brand)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand)]"
                      : ""
                  }
                />
              );
            })}
          </nav>
        </SidebarContent>

        <SidebarFooter className="border-t border-[var(--border)]">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-red-500/10 hover:text-red-500"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span
              className={`whitespace-nowrap transition-opacity ${
                open ? "opacity-100" : "opacity-0"
              }`}
            >
              Log out
            </span>
          </button>
        </SidebarFooter>
      </SidebarBody>
    </Sidebar>
  );
}
