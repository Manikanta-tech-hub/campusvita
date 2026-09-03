"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  UtensilsCrossed,
  ClipboardList,
  Layers3,
  Settings,
  CreditCard,
  Users,
  Store,
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
      className="w-full border-r border-zinc-800 bg-[#111113] flex flex-col"
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
      <div className="py-4">
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
    </motion.aside>
  );
}