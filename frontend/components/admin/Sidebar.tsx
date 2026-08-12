"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ClipboardList,
  BarChart3,
  ChefHat,
} from "lucide-react";
export default function Sidebar() {
  const pathname = usePathname();

  const menus = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Menu",
      href: "/admin/menu",
      icon: UtensilsCrossed,
    },
    {
      name: "Orders",
      href: "/admin/orders",
      icon: ClipboardList,
    },
    {
      name: "Analytics",
      href: "/admin/analytics",
      icon: BarChart3,
    },
    {
      name: "Food Management",
      href: "/admin/food-management",
      icon: ChefHat,
    },
  ];

  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800 min-h-screen">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-zinc-800">
        <h1 className="text-2xl font-bold text-orange-500">
          CampusVita
        </h1>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {menus.map((menu) => {
          const Icon = menu.icon;

          return (
            <Link
              key={menu.href}
              href={menu.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                pathname === menu.href
                  ? "bg-orange-500 text-white"
                  : "text-gray-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              <Icon size={20} />
              <span>{menu.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}