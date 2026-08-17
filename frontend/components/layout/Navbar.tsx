"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  ShoppingCart,
  Heart,
  ClipboardList,
  User,
  Wallet,
  ChefHat,
  LogOut,
  Moon,
  Sun,
  ArrowRight,
} from "lucide-react";

import { useCart } from "../../context/CartContext";

const navItems = [
  {
    label: "Home",
    href: "/",
    icon: Home,
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
    label: "Wallet",
    href: "/wallet",
    icon: Wallet,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: User,
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // ============================================================
  // EXISTING CART CONTEXT
  // ============================================================

  const { cartItems } = useCart();

  // Count actual quantities, not just unique products.
  const cartCount = useMemo(() => {
    return cartItems.reduce(
      (total, item) => total + Number(item.quantity || 0),
      0
    );
  }, [cartItems]);

  const hasItemsInCart = cartCount > 0;

  // ============================================================
  // MOUNT
  // ============================================================

  useEffect(() => {
    setMounted(true);
  }, []);

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
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

  // ============================================================
  // ACTIVE NAV ITEM
  // ============================================================

  const isActive = (href: string) => {
    return (
      pathname === href ||
      (href !== "/" && pathname.startsWith(href))
    );
  };

  return (
    <>
      {/* ========================================================
          DESKTOP NAVBAR
          IMPORTANT: Desktop layout remains unchanged.
          ======================================================== */}

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
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                    active
                      ? "bg-orange-500 text-white shadow-lg font-semibold"
                      : "text-gray-700 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-zinc-800 hover:text-orange-600"
                  }`}
                >
                  <Icon size={18} />

                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Theme + Logout */}

          <div className="flex items-center gap-3 ml-4">

            {mounted && (
              <button
                type="button"
                onClick={() => {
                  const newTheme =
                    theme === "dark" ? "light" : "dark";

                  setTheme(newTheme);
                }}
                className="p-2 rounded-xl bg-zinc-800 dark:bg-zinc-700 hover:bg-orange-500 transition"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun
                    size={20}
                    className="text-yellow-400"
                  />
                ) : (
                  <Moon
                    size={20}
                    className="text-white"
                  />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition"
            >
              <LogOut size={18} />

              <span className="hidden lg:inline">
                Logout
              </span>
            </button>

          </div>
        </div>
      </header>

      {/* ========================================================
          MOBILE FLOATING CART
          
          Only appears when cart has at least 1 item.
          Desktop completely unaffected.
          ======================================================== */}

      <div
        className={`fixed bottom-[76px] right-4 z-[60] md:hidden transition-all duration-300 ease-out ${
          hasItemsInCart
            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
            : "opacity-0 translate-y-4 scale-90 pointer-events-none"
        }`}
      >
        <Link
          href="/cart"
          aria-label={`Open cart with ${cartCount} ${
            cartCount === 1 ? "item" : "items"
          }`}
          className="group flex items-center gap-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 shadow-2xl shadow-black/40 border border-orange-400/30 transition-all duration-300 active:scale-95"
        >
          {/* Cart Icon */}

          <div className="relative flex items-center justify-center">
            <ShoppingCart size={22} strokeWidth={2.5} />

            {/* Small live count badge */}

            <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-white text-orange-600 text-[10px] font-bold flex items-center justify-center shadow-sm">
              {cartCount}
            </span>
          </div>

          {/* Cart Text */}

          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold">
              Cart
            </span>

            <span className="text-[11px] text-orange-100 mt-1">
              {cartCount}{" "}
              {cartCount === 1 ? "item" : "items"}
            </span>
          </div>

          {/* Arrow */}

          <ArrowRight
            size={20}
            strokeWidth={2.5}
            className="transition-transform duration-300 group-hover:translate-x-1"
          />
        </Link>
      </div>

      {/* ========================================================
          MOBILE BOTTOM NAVIGATION
          
          Cart intentionally removed.
          
          Home
          Favorites
          Orders
          Wallet
          Profile
          ======================================================== */}

      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-950 border-t border-gray-200 dark:border-zinc-800 shadow-lg md:hidden z-50">
        <div className="grid grid-cols-5 h-16">

          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center text-xs relative transition-all duration-200 ${
                  active
                    ? "text-orange-600"
                    : "text-gray-500 hover:text-orange-500"
                }`}
              >
                <Icon size={20} />

                <span className="mt-1">
                  {item.label}
                </span>
              </Link>
            );
          })}

        </div>
      </nav>
    </>
  );
}