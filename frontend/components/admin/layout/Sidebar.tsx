"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  UtensilsCrossed,
  ClipboardList,
  Layers3,
  BarChart3,
  Settings,
  ShieldCheck,
  CreditCard,
  Users,
} from "lucide-react";

import SidebarItem from "./SidebarItem";
import SidebarSection from "./SidebarSection";

const navigation = [
  {
    title: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Management",
    items: [
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
        label: "Customers",
        href: "/admin/customers",
        icon: Users,
      },
      {
        label: "Payments",
        href: "/admin/payments",
        icon: CreditCard,
      },
    ],
  },
  {
    title: "Business",
    items: [
      {
        label: "Analytics",
        href: "/admin/analytics",
        icon: BarChart3,
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        label: "Settings",
        href: "/admin/settings",
        icon: Settings,
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <motion.aside
      initial={{ x: -40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="w-72 border-r border-zinc-800 bg-[#111113] flex flex-col"
    >
      {/* Logo */}

      <div className="border-b border-zinc-800 px-6 py-7">
        <h1 className="text-3xl font-bold text-orange-500">
          CampusVita
        </h1>

        <p className="mt-1 text-sm text-zinc-500">
          Enterprise Admin
        </p>
      </div>

      {/* Navigation */}

      <div className="flex-1 overflow-y-auto py-4">
        {navigation.map((section) => (
          <div key={section.title}>
            <SidebarSection title={section.title} />

            <div className="space-y-1 px-3">
              {section.items.map((item) => (
                <SidebarItem
                  key={item.href}
                  label={item.label}
                  href={item.href}
                  icon={item.icon}
                  active={pathname === item.href}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}

      <div className="border-t border-zinc-800 p-5">
        <div className="flex items-center gap-3 rounded-2xl bg-zinc-900 p-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500">
            <ShieldCheck
              size={22}
              className="text-white"
            />
          </div>

          <div>
            <p className="font-semibold text-white">
              Administrator
            </p>

            <p className="text-xs text-zinc-500">
              CampusVita
            </p>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}