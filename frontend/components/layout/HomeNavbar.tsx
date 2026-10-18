"use client";

import Link from "next/link";
import {
useEffect,
useMemo,
useRef,
useState,
} from "react";
import { usePathname } from "next/navigation";

import {
AnimatePresence,
motion,
useReducedMotion,
} from "framer-motion";

import {
Home,
Menu,
ShoppingCart,
X,
} from "lucide-react";

import clsx from "clsx";

import { useCart } from "../../context/CartContext";
import BrandLogo from "@/components/branding/BrandLogo";
import { getSession } from "@/app/lib/auth/session";

// ============================================================
// NAVIGATION ITEMS
//
// Every href is an existing CampusVita user route.
// Food/stall browsing lives on the home route ("/"); individual
// stalls use the dynamic "/stall/[stallId]" route and are opened
// from the stall cards, so they are not navbar links.
// ============================================================

const navItems = [
{
label: "Home",
href: "/",
icon: Home,
},
{
label: "Explore Stalls",
href: "/stalls",
icon: ShoppingCart,
},
{
label: "How It Works",
href: "/#how-it-works",
icon: Home,
},
];

// ============================================================
// SCROLL BEHAVIOUR CONSTANTS
// ============================================================

const TOP_THRESHOLD = 48;
const COLLAPSE_AFTER = 140;
const SCROLL_DELTA = 10;
const MOBILE_BREAKPOINT = 768;

const SPRING = {
type: "spring",
stiffness: 380,
damping: 34,
mass: 0.9,
} as const;

const PANEL_EASE = [0.16, 1, 0.3, 1] as const;

// ============================================================
// PROPS
// ============================================================

type HomeNavbarProps = {
showCart?: boolean;
};

// ============================================================
// USER HOME NAVBAR
//
// Floating, centered, pill-shaped navbar with scroll driven
// collapse / expand (21st.dev AnimatedNavFramer inspired).
// ============================================================

export default function HomeNavbar({
showCart = true,
}: HomeNavbarProps) {
const pathname = usePathname();
const reduceMotion = useReducedMotion();

const [expanded, setExpanded] = useState(true);
const [menuOpen, setMenuOpen] = useState(false);
const [signedIn, setSignedIn] = useState(false);

const headerRef = useRef<HTMLElement | null>(null);
const lastScrollY = useRef(0);

// ============================================================
// CART (existing cart state - no fake data)
// ============================================================

const { cartItems } = useCart();

const cartCount = useMemo(() => {
return cartItems.reduce(
(total, item) =>
total + Number(item.quantity || 0),
0
);
}, [cartItems]);

// ============================================================
// SCROLL DIRECTION
//
// Scrolling down past a threshold collapses the navbar.
// Scrolling up (or returning to the top) expands it again.
// ============================================================

useEffect(() => {
lastScrollY.current = window.scrollY;


const handleScroll = () => {
  const currentY = window.scrollY;
  const delta = currentY - lastScrollY.current;

  lastScrollY.current = currentY;

  if (currentY <= TOP_THRESHOLD) {
    setExpanded(true);
    return;
  }

  if (
    delta >= SCROLL_DELTA &&
    currentY > COLLAPSE_AFTER
  ) {
    setExpanded(false);
    setMenuOpen(false);
    return;
  }

  if (delta <= -SCROLL_DELTA) {
    setExpanded(true);
  }
};

window.addEventListener("scroll", handleScroll, {
  passive: true,
});

return () => {
  window.removeEventListener(
    "scroll",
    handleScroll
  );
};


}, []);

useEffect(() => {
  setSignedIn(Boolean(getSession("USER")));
}, []);

// ============================================================
// MENU CLOSE HELPERS
// ============================================================

useEffect(() => {
if (!menuOpen) return;

const handlePointerDown = (event: MouseEvent) => {
  if (
    headerRef.current &&
    !headerRef.current.contains(
      event.target as Node
    )
  ) {
    setMenuOpen(false);
  }
};

const handleKeyDown = (
  event: KeyboardEvent
) => {
  if (event.key === "Escape") {
    setMenuOpen(false);
  }
};

document.addEventListener(
  "mousedown",
  handlePointerDown
);

document.addEventListener(
  "keydown",
  handleKeyDown
);

return () => {
  document.removeEventListener(
    "mousedown",
    handlePointerDown
  );

  document.removeEventListener(
    "keydown",
    handleKeyDown
  );
};

}, [menuOpen]);

// ============================================================
// INTERACTIONS
// ============================================================

const expandNav = () => {
setExpanded(true);


// On small screens the links live in the drop-down panel,
// so expanding the pill also opens the panel.
if (
  typeof window !== "undefined" &&
  window.innerWidth < MOBILE_BREAKPOINT
) {
  setMenuOpen(true);
}


};

const isActive = (href: string) => {
return (
pathname === href ||
(href !== "/" && pathname.startsWith(href))
);
};

// ============================================================
// RENDER
// ============================================================

return ( <header
   ref={headerRef}
   className="
     sticky
     top-0
     z-50
     h-0
     px-3
     sm:px-4
     bg-transparent
   "
 >
{/* ====================================================
FLOATING PILL
==================================================== */}


  <div
    className="
      flex
      h-full
      items-start
      justify-center
    "
  >
    <motion.nav
      aria-label="CampusVita main navigation"
      layout={!reduceMotion}
      transition={SPRING}
      className={clsx(
        "cv-glass-elevated relative mt-2 flex h-12 items-center rounded-full transition-colors duration-200",
        expanded
          ? "gap-1 px-2 py-1"
          : "w-12 justify-center p-0"
      )}
    >
      {expanded ? (
        <>
          <Link href="/" aria-label="CampusVita home" className="ml-1 hidden h-9 items-center pr-2 md:flex">
            <BrandLogo className="h-7" />
          </Link>
          {/* ====================================================
              DESKTOP LINKS
              ==================================================== */}

          <ul
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
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={
                      active
                        ? "page"
                        : undefined
                    }
                    className={clsx(
                      "flex items-center gap-2 rounded-full px-3 py-2 text-[13px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--brand)]",
                      active
                        ? "bg-[var(--primary)] font-semibold text-[var(--on-primary)] shadow-[0_4px_14px_rgba(0,0,0,0.16)]"
                        : "font-medium text-[var(--text-secondary)] hover:bg-[var(--primary-soft)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    <Icon
                      size={16}
                      strokeWidth={
                        active ? 2.4 : 2
                      }
                    />

                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* ====================================================
              CART
              ==================================================== */}

          {showCart && (
            <Link
              href="/cart"
              aria-label={
                cartCount > 0
                  ? `Cart, ${cartCount} ${
                      cartCount === 1
                        ? "item"
                        : "items"
                    }`
                  : "Cart"
              }
              aria-current={
                isActive("/cart")
                  ? "page"
                  : undefined
              }
              className="
                relative
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-full
                text-[var(--text-secondary)]
                transition-colors
                duration-200
                hover:bg-[var(--primary-soft)]
                hover:text-[var(--text-primary)]
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-[var(--brand)]
                focus-visible:ring-offset-2
                focus-visible:ring-offset-[var(--background)]
              "
            >
              <ShoppingCart
                size={18}
                strokeWidth={2.2}
              />

              {cartCount > 0 && (
                <span
                  aria-hidden="true"
                  className="
                    absolute
                    -right-0.5
                    -top-0.5
                    flex
                    h-4
                    min-w-4
                    items-center
                    justify-center
                    rounded-full
                    bg-[var(--accent)]
                    px-1
                    text-[9px]
                    font-black
                    leading-none
                    text-[var(--on-accent)]
                    shadow-sm
                  "
                >
                  {cartCount > 99
                    ? "99+"
                    : cartCount}
                </span>
              )}
            </Link>
          )}

          <Link href="/track-order" className="hidden rounded-full px-3 py-2 text-[13px] font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--primary-soft)] hover:text-[var(--text-primary)] md:inline-flex">
            Track order
          </Link>

          <Link href={signedIn ? "/profile" : "/login"} className="hidden rounded-full bg-[var(--primary)] px-3.5 py-2 text-[13px] font-semibold text-[var(--on-primary)] md:inline-flex">
            {signedIn ? "Account" : "Log in"}
          </Link>

          {/* ====================================================
              MOBILE MENU BUTTON
              ==================================================== */}

          <button
            type="button"
            onClick={() =>
              setMenuOpen((open) => !open)
            }
            aria-expanded={menuOpen}
            aria-controls="campusvita-nav-panel"
            aria-label={
              menuOpen
                ? "Close navigation menu"
                : "Open navigation menu"
            }
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-full
              text-[var(--text-secondary)]
              transition-colors
              duration-200
              hover:bg-[var(--brand-soft)]
              hover:text-[var(--brand)]
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-[var(--brand)]
              focus-visible:ring-offset-2
              focus-visible:ring-offset-[var(--background)]
              md:hidden
            "
          >
            {menuOpen ? (
              <X
                size={19}
                strokeWidth={2.3}
              />
            ) : (
              <Menu
                size={19}
                strokeWidth={2.3}
              />
            )}
          </button>
        </>
      ) : (
        /* ====================================================
            COLLAPSED STATE - single circular menu button
            ==================================================== */

        <button
          type="button"
          onClick={expandNav}
          aria-label="Show navigation menu"
          aria-expanded={false}
          className="
            flex
            h-full
            w-full
            items-center
            justify-center
            rounded-full
            bg-[var(--primary)]
            text-[var(--on-primary)]
            shadow-[0_8px_20px_rgba(0,0,0,0.2)]
            transition-colors
            duration-200
            hover:bg-[var(--primary-hover)]
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-[var(--brand)]
            focus-visible:ring-offset-2
            focus-visible:ring-offset-[var(--background)]
          "
        >
          <Menu
            size={20}
            strokeWidth={2.4}
          />
        </button>
      )}
    </motion.nav>
  </div>

  {/* ====================================================
      MOBILE DROP-DOWN PANEL
      ==================================================== */}

  <AnimatePresence>
    {expanded && menuOpen && (
      <motion.div
        id="campusvita-nav-panel"
        key="campusvita-nav-panel"
        initial={
          reduceMotion
            ? {
                opacity: 0,
                x: "-50%",
              }
            : {
                opacity: 0,
                y: -10,
                x: "-50%",
              }
        }
        animate={
          reduceMotion
            ? {
                opacity: 1,
                x: "-50%",
              }
            : {
                opacity: 1,
                y: 0,
                x: "-50%",
              }
        }
        exit={
          reduceMotion
            ? {
                opacity: 0,
                x: "-50%",
              }
            : {
                opacity: 0,
                y: -10,
                x: "-50%",
              }
        }
        transition={
          reduceMotion
            ? { duration: 0 }
            : {
                duration: 0.22,
                ease: PANEL_EASE,
              }
        }
        className="
          cv-glass-elevated
          absolute
          left-1/2
          top-full
          mt-2
          w-[min(19rem,calc(100vw-1.5rem))]
          rounded-2xl
          p-2
          md:hidden
        "
      >
        <ul
          className="
            flex
            flex-col
            gap-0.5
          "
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() =>
                    setMenuOpen(false)
                  }
                  aria-current={
                    active
                      ? "page"
                      : undefined
                  }
                  className={clsx(
                    "flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--brand)]",
                    active
                      ? "bg-[var(--primary)] font-semibold text-[var(--on-primary)]"
                      : "font-medium text-[var(--text-secondary)] hover:bg-[var(--primary-soft)] hover:text-[var(--text-primary)]"
                  )}
                >
                  <Icon
                    size={17}
                    strokeWidth={
                      active ? 2.4 : 2
                    }
                  />

                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {showCart && (
          <div
            className="
              mt-1
              border-t
              border-[var(--border)]
              pt-1
            "
          >
            <Link
              href="/cart"
              onClick={() =>
                setMenuOpen(false)
              }
              aria-label={
                cartCount > 0
                  ? `Cart, ${cartCount} ${
                      cartCount === 1
                        ? "item"
                        : "items"
                    }`
                  : "Cart"
              }
              className="
                flex
                items-center
                gap-3
                rounded-xl
                px-3
                py-3
                text-sm
                font-medium
                text-[var(--text-secondary)]
                transition-colors
                duration-150
                hover:bg-[var(--primary-soft)]
                hover:text-[var(--text-primary)]
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-inset
                focus-visible:ring-[var(--brand)]
              "
            >
              <span
                className="
                  relative
                  flex
                  h-[17px]
                  w-[17px]
                  items-center
                  justify-center
                "
              >
                <ShoppingCart
                  size={17}
                  strokeWidth={2.2}
                />

                {cartCount > 0 && (
                  <span
                    aria-hidden="true"
                    className="
                      absolute
                      -right-1.5
                      -top-1.5
                      flex
                      h-4
                      min-w-4
                      items-center
                      justify-center
                      rounded-full
                      bg-[var(--accent)]
                      px-1
                      text-[9px]
                      font-black
                      leading-none
                      text-[var(--on-accent)]
                    "
                  >
                    {cartCount > 99
                      ? "99+"
                      : cartCount}
                  </span>
                )}
              </span>

              <span className="flex-1">
                Cart
              </span>

              {cartCount > 0 && (
                <span
                  className="
                    text-xs
                    font-semibold
                    text-[var(--text-muted)]
                  "
                >
                  {cartCount}{" "}
                  {cartCount === 1
                    ? "item"
                    : "items"}
                </span>
              )}
            </Link>
          </div>
        )}
      </motion.div>
    )}
  </AnimatePresence>
</header>


);
}
