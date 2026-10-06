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
          ======================================================== */}

      <header
        className="
          sticky
          top-0
          z-50
          border-b
          border-[var(--border)]
          bg-[var(--navbar)]
          shadow-[var(--shadow-soft)]
          backdrop-blur-xl
          transition-colors
          duration-200
        "
      >
        <div
          className="
            mx-auto
            flex
            h-16
            max-w-7xl
            items-center
            justify-between
            px-4
            sm:px-6
          "
        >
          {/* ====================================================
              LOGO
              ==================================================== */}

          <Link
            href="/"
            aria-label="CampusVita home"
            className="
              group
              flex
              items-center
              gap-2
              rounded-xl
              px-1
              py-1
              text-xl
              font-bold
              text-[var(--brand)]
              transition-all
              duration-200
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-[var(--brand)]
              focus-visible:ring-offset-2
              focus-visible:ring-offset-[var(--background)]
              sm:text-2xl
            "
          >
            <ChefHat
              size={28}
              strokeWidth={2.3}
              className="
                transition-transform
                duration-200
                group-hover:rotate-[-5deg]
              "
            />

            <span>CampusVita</span>
          </Link>

          {/* ====================================================
              DESKTOP NAVIGATION
              ==================================================== */}

          <nav
            aria-label="Main navigation"
            className="
              hidden
              items-center
              gap-1
              md:flex
            "
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={
                    active
                      ? "page"
                      : undefined
                  }
                  className={`
                    group
                    relative
                    flex
                    items-center
                    gap-2
                    rounded-xl
                    px-4
                    py-2.5
                    text-sm
                    transition-all
                    duration-200
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-[var(--brand)]
                    ${
                      active
                        ? `
                          bg-[var(--brand)]
                          font-semibold
                          text-white
                          shadow-md
                          shadow-orange-500/15
                        `
                        : `
                          font-medium
                          text-[var(--text-secondary)]
                          hover:bg-[var(--brand-soft)]
                          hover:text-[var(--brand)]
                        `
                    }
                  `}
                >
                  <Icon
                    size={18}
                    strokeWidth={
                      active ? 2.4 : 2
                    }
                  />

                  <span>{item.label}</span>

                  {/* Dark theme secondary accent */}
                  {active && (
                    <span
                      aria-hidden="true"
                      className="
                        absolute
                        bottom-1
                        left-1/2
                        hidden
                        h-0.5
                        w-4
                        -translate-x-1/2
                        rounded-full
                        bg-white/70
                        dark:block
                      "
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* ========================================================
          MOBILE FLOATING CART
          ======================================================== */}

      {showCart && hasItemsInCart && (
        <div
          className="
            fixed
            bottom-[76px]
            right-4
            z-[60]
            md:hidden
          "
        >
          <Link
            href="/cart"
            aria-label={`Open cart with ${cartCount} ${
              cartCount === 1
                ? "item"
                : "items"
            }`}
            className="
              group
              flex
              items-center
              gap-3
              rounded-2xl
              border
              border-orange-400/30
              bg-[var(--brand)]
              px-4
              py-3
              text-white
              shadow-xl
              shadow-black/20
              transition-all
              duration-200
              hover:bg-[var(--brand-hover)]
              active:scale-[0.97]
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-[var(--brand)]
              focus-visible:ring-offset-2
              focus-visible:ring-offset-[var(--background)]
            "
          >
            {/* CART ICON */}

            <div className="relative flex items-center justify-center">
              <ShoppingCart
                size={22}
                strokeWidth={2.5}
              />

              {/* CART COUNT */}

              <span
                className="
                  absolute
                  -right-2
                  -top-2
                  flex
                  h-[18px]
                  min-w-[18px]
                  items-center
                  justify-center
                  rounded-full
                  bg-white
                  px-1
                  text-[10px]
                  font-bold
                  text-orange-600
                  shadow-sm
                "
              >
                {cartCount}
              </span>
            </div>

            {/* CART TEXT */}

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

            {/* ARROW */}

            <ArrowRight
              size={20}
              strokeWidth={2.5}
              className="
                transition-transform
                duration-200
                group-hover:translate-x-1
              "
            />
          </Link>
        </div>
      )}

      {/* ========================================================
          MOBILE BOTTOM NAVIGATION
          ======================================================== */}

      <nav
        aria-label="Mobile navigation"
        className="
          fixed
          bottom-0
          left-0
          right-0
          z-50
          border-t
          border-[var(--border)]
          bg-[var(--navbar)]
          shadow-[0_-4px_20px_rgba(0,0,0,0.06)]
          backdrop-blur-xl
          transition-colors
          duration-200
          md:hidden
        "
      >
        <div className="grid h-16 grid-cols-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={
                  active
                    ? "page"
                    : undefined
                }
                className={`
                  group
                  relative
                  flex
                  flex-col
                  items-center
                  justify-center
                  gap-0.5
                  text-xs
                  transition-all
                  duration-200
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-inset
                  focus-visible:ring-[var(--brand)]
                  ${
                    active
                      ? `
                        font-semibold
                        text-[var(--brand)]
                      `
                      : `
                        font-medium
                        text-[var(--text-muted)]
                        hover:text-[var(--brand)]
                      `
                  }
                `}
              >
                <Icon
                  size={20}
                  strokeWidth={
                    active ? 2.5 : 2
                  }
                  className="
                    transition-transform
                    duration-200
                    group-active:scale-90
                  "
                />

                <span>{item.label}</span>

                {/* Active indicator */}

                {active && (
                  <span
                    aria-hidden="true"
                    className="
                      absolute
                      bottom-1
                      h-1
                      w-5
                      rounded-full
                      bg-[var(--brand)]
                    "
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}