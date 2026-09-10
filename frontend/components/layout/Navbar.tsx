"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";

import {
  Home,
  ShoppingCart,
  ClipboardList,
  User,
  Wallet,
  ChefHat,
  ArrowRight,
} from "lucide-react";

import { useCart } from "../../context/CartContext";

// ============================================================
// NAVIGATION ITEMS
// ============================================================

const navItems = [
  {
    label: "Home",
    href: "/",
    icon: Home,
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

// ============================================================
// NAVBAR PROPS
// ============================================================

type NavbarProps = {
  showCart?: boolean;
};

// ============================================================
// NAVBAR
// ============================================================

export default function Navbar({
  showCart = true,
}: NavbarProps) {
  const pathname = usePathname();

  // ============================================================
  // CART
  // ============================================================

  const { cartItems } = useCart();

  const cartCount = useMemo(() => {
    return cartItems.reduce(
      (total, item) =>
        total + Number(item.quantity || 0),
      0
    );
  }, [cartItems]);

  const hasItemsInCart = cartCount > 0;

  // ============================================================
  // ACTIVE NAV ITEM
  // ============================================================

  const isActive = (href: string) => {
    return (
      pathname === href ||
      (href !== "/" &&
        pathname.startsWith(href))
    );
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      {/* ========================================================
          DESKTOP / TOP NAVBAR

          Theme and Logout buttons have been removed.
          ======================================================== */}

      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

          {/* ====================================================
              LOGO
              ==================================================== */}

          <Link
            href="/"
            className="flex items-center gap-2 text-2xl font-bold text-orange-600"
          >
            <ChefHat size={28} />

            <span>CampusVita</span>
          </Link>

          {/* ====================================================
              DESKTOP NAVIGATION
              ==================================================== */}

          <nav className="hidden items-center gap-3 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-2 rounded-xl px-4 py-2 transition-all duration-300 ${
                    active
                      ? "bg-orange-500 font-semibold text-white shadow-lg"
                      : "text-gray-700 hover:bg-orange-100 hover:text-orange-600 dark:text-gray-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  <Icon size={18} />

                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

        </div>
      </header>

      {/* ========================================================
          MOBILE FLOATING CART

          IMPORTANT:
          This entire cart button is controlled by showCart.

          showCart = false
          → Cart button does not render.

          showCart = true
          → Cart button behaves normally.
          ======================================================== */}

      {showCart && hasItemsInCart && (
        <div className="fixed bottom-[76px] right-4 z-[60] md:hidden">

          <Link
            href="/cart"
            aria-label={`Open cart with ${cartCount} ${
              cartCount === 1
                ? "item"
                : "items"
            }`}
            className="group flex items-center gap-3 rounded-2xl border border-orange-400/30 bg-orange-500 px-4 py-3 text-white shadow-2xl shadow-black/40 transition-all duration-300 hover:bg-orange-600 active:scale-95"
          >

            {/* ==================================================
                CART ICON
                ================================================== */}

            <div className="relative flex items-center justify-center">

              <ShoppingCart
                size={22}
                strokeWidth={2.5}
              />

              {/* CART COUNT */}

              <span className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-orange-600 shadow-sm">
                {cartCount}
              </span>

            </div>

            {/* ==================================================
                CART TEXT
                ================================================== */}

            <div className="flex flex-col leading-none">

              <span className="text-sm font-bold">
                Cart
              </span>

              <span className="mt-1 text-[11px] text-orange-100">
                {cartCount}{" "}
                {cartCount === 1
                  ? "item"
                  : "items"}
              </span>

            </div>

            {/* ==================================================
                ARROW
                ================================================== */}

            <ArrowRight
              size={20}
              strokeWidth={2.5}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />

          </Link>

        </div>
      )}

      {/* ========================================================
          MOBILE BOTTOM NAVIGATION

          Home | Orders | Wallet | Profile
          ======================================================== */}

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950 md:hidden">

        <div className="grid h-16 grid-cols-4">

          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center justify-center text-xs transition-all duration-200 ${
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