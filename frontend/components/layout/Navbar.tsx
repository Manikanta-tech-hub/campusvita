 "use client";

import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
    Home,
    UtensilsCrossed,
    ShoppingCart,
    Heart,
    ClipboardList,
    User,
    ChefHat,
    LogOut,
  } from "lucide-react";

const navItems = [
  {
    label: "Home",
    href: "/",
    icon: Home,
  },
  {
    label: "Menu",
    href: "/menu",
    icon: UtensilsCrossed,
  },
  {
    label: "Cart",
    href: "/cart",
    icon: ShoppingCart,
  },
  {
    label: "Favorites",
    href: "/favorites",
    icon: Heart,
  },
  {
    label: "Orders",
    href: "/orders",
    icon: ClipboardList,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: User,
  },
];

export default function Navbar() {
    const pathname = usePathname();

    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
      setMounted(true);
    }, []);

  // Later connect this with CartContext
  const cartCount = 0;
  const router = useRouter();
  const handleLogout = () => {
    // Remove all login-related data
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("token_type");
    localStorage.removeItem("expires_in");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("email");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
  
    router.replace("/login");
  };

  return (
    <>
      {/* Desktop Navbar */}
      <header className="sticky top-0 z-50 bg-white dark:bg-zinc-950 border-b border-gray-200 dark:border-zinc-800 backdrop-blur-lg shadow-sm">
        <div className="max-w-7xl mx-auto h-16 px-6 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-2xl text-orange-600"
          >
            <ChefHat size={28} />
            <span>CampusVita</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-3">
            {navItems.map((item) => {
              const Icon = item.icon;

              const active =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300
                    ${
                      active
                        ? "bg-orange-500 text-white shadow-lg font-semibold"
                        : "text-gray-700 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-zinc-800 hover:text-orange-600"
                    }`}
                >
                  <Icon size={18} />

                  <span>{item.label}</span>

                  {item.label === "Cart" && cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-3 ml-4">
  {mounted && (
    <button
      onClick={() => {
        const newTheme = theme === "dark" ? "light" : "dark";
        setTheme(newTheme);
      }}
      className="p-2 rounded-xl bg-zinc-800 dark:bg-zinc-700 hover:bg-orange-500 transition"
    >
      {theme === "dark" ? (
        <Sun size={20} className="text-yellow-400" />
      ) : (
        <Moon size={20} className="text-white" />
      )}
    </button>
  )}

  <button
    onClick={handleLogout}
    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition"
  >
    <LogOut size={18} />
    <span className="hidden lg:inline">Logout</span>
  </button>
</div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-950 border-t border-gray-200 dark:border-zinc-800 shadow-lg md:hidden z-50">
        <div className="grid grid-cols-6 h-16">
          {navItems.map((item) => {
            const Icon = item.icon;

            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center text-xs relative transition-all
                  ${
                    active
                      ? "text-orange-600"
                      : "text-gray-500 hover:text-orange-500"
                  }`}
              >
                <Icon size={20} />

                {item.label === "Cart" && cartCount > 0 && (
                  <span className="absolute top-1 right-5 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}

                <span className="mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}