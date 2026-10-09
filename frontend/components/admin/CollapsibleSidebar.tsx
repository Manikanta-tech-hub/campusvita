"use client";

import {
  ChefHat,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  CreditCard,
  Layers3,
  LayoutDashboard,
  LogOut,
  Settings,
  Store,
  UtensilsCrossed,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { clearSession } from "@/app/lib/auth/session";

/*
  SINGLE SOURCE OF TRUTH FOR ADMIN NAVIGATION

  21st.dev "dashboard-with-collapsible-sidebar" shell adapted to
  CampusVita branding and the real /admin routes.

  NOTE: globals.css ships unlayered element rules (a, button, p)
  that beat layered Tailwind colour utilities, so every colour
  utility on those elements uses the trailing `!` important modifier.
*/

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const MAIN_NAV: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Food",
    href: "/admin/food-management",
    icon: UtensilsCrossed,
  },
  {
    label: "Orders",
    href: "/admin/orders",
    icon: ClipboardList,
  },
  {
    label: "Categories",
    href: "/admin/category",
    icon: Layers3,
  },
  {
    label: "Stalls",
    href: "/admin/stalls",
    icon: Store,
  },
  {
    label: "Customers",
    href: "/admin/customers",
    icon: Users,
  },
  {
    label: "Payments",
    href: "/admin/payments",
    icon: CreditCard,
  },
];

const ACCOUNT_NAV: NavItem[] = [
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

type Props = {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
};

export default function CollapsibleSidebar({
  collapsed,
  onToggle,
  onNavigate,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    clearSession("ADMIN");
    router.replace("/login");
  };

  const renderLink = (item: NavItem) => {
    const active = pathname === item.href;
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        aria-label={item.label}
        title={collapsed ? item.label : undefined}
        className={[
          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-200",
          collapsed ? "justify-center px-0" : "",
          active
            ? "bg-brand/10 font-semibold text-brand!"
            : "text-text-secondary! hover:bg-card-hover hover:text-text-primary!",
        ].join(" ")}
      >
        <Icon
          size={20}
          strokeWidth={active ? 2.2 : 1.8}
          className="shrink-0"
        />

        {!collapsed && (
          <span className="truncate text-sm">
            {item.label}
          </span>
        )}

        {/* Collapsed-state tooltip */}

        {collapsed && (
          <span
            role="tooltip"
            style={{ backgroundColor: "var(--surface)" }}
            className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium text-white! shadow-xl group-hover:block"
          >
            {item.label}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside
      className={[
        "sticky top-0 flex h-full shrink-0 flex-col border-r border-border bg-card transition-[width] duration-300 ease-in-out lg:h-screen",
        collapsed ? "w-20" : "w-72",
      ].join(" ")}
    >
      {/* BRAND */}

      <div
        className={[
          "flex shrink-0 gap-3 border-b border-border px-5 py-4",
          collapsed ? "justify-center px-0" : "items-center",
        ].join(" ")}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-hover shadow-md shadow-brand-hover/25">
          <ChefHat
            size={20}
            strokeWidth={2.2}
            className="text-white!"
          />
        </span>

        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold leading-tight text-text-primary!">
              CampusVita
            </p>

            <p className="truncate text-xs text-text-muted!">
              Admin
            </p>
          </div>
        )}
      </div>

      {/* NAVIGATION */}

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {MAIN_NAV.map(renderLink)}
        </div>

        {!collapsed && (
          <div className="mx-1 my-3 border-t border-border" />
        )}

        <p
          className={[
            "px-3 pb-1.5 pt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted!",
            collapsed ? "hidden" : "",
          ].join(" ")}
        >
          Account
        </p>

        <div className="space-y-1">
          {ACCOUNT_NAV.map(renderLink)}
        </div>
      </nav>

      {/* FOOTER: logout + collapse control */}

      <div className="shrink-0 space-y-1 border-t border-border p-3">
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Logout"
          title={collapsed ? "Logout" : undefined}
          className={[
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-200 text-text-secondary! hover:bg-danger/10 hover:text-danger!",
            collapsed ? "justify-center px-0" : "",
          ].join(" ")}
        >
          <LogOut size={20} className="shrink-0" />

          {!collapsed && (
            <span className="text-sm font-medium">
              Logout
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onToggle}
          aria-label={
            collapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
          }
          title={
            collapsed ? "Expand sidebar" : "Hide"
          }
          className={[
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-200 text-text-muted! hover:bg-card-hover hover:text-text-primary!",
            collapsed ? "justify-center px-0" : "",
          ].join(" ")}
        >
          {collapsed ? (
            <ChevronsRight size={20} className="shrink-0" />
          ) : (
            <>
              <ChevronsLeft size={20} className="shrink-0" />

              <span className="text-sm font-medium">
                Hide
              </span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
