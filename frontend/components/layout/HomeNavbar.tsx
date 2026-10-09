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
ClipboardList,
Heart,
Home,
Menu,
ShoppingCart,
User,
Wallet,
X,
} from "lucide-react";

import clsx from "clsx";

import { useCart } from "../../context/CartContext";

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
label: "Favorites",
href: "/favorites",
icon: Heart,
},
{
label: "Profile",
href: "/profile",
icon: User,
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
        "relative mt-2 flex h-12 items-center rounded-full border border-[var(--navbar-border)] bg-[var(--navbar)] shadow-[var(--shadow-elevated)] backdrop-blur-xl transition-colors duration-200",
        expanded
          ? "gap-1 px-2 py-1"
          : "w-12 justify-center p-0"
      )}
    >
      {expanded ? (
        <>
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
                        ? "bg-[var(--brand)] font-semibold text-white shadow-[0_6px_16px_rgba(104,110,232,0.28)]"
                        : "font-medium text-[var(--text-secondary)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand)]"
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
                hover:bg-[var(--brand-soft)]
                hover:text-[var(--brand)]
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
                    bg-[var(--brand)]
                    px-1
                    text-[9px]
                    font-black
                    leading-none
                    text-white
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
            bg-[var(--brand)]
            text-white
            shadow-[0_8px_20px_rgba(104,110,232,0.4)]
            transition-colors
            duration-200
            hover:bg-[var(--brand-hover)]
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
          absolute
          left-1/2
          top-full
          mt-2
          w-[min(19rem,calc(100vw-1.5rem))]
          rounded-2xl
          border
          border-[var(--border)]
          bg-[var(--surface)]
          p-2
          shadow-[var(--shadow-elevated)]
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
                      ? "bg-[var(--brand)] font-semibold text-white"
                      : "font-medium text-[var(--text-secondary)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand)]"
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
                hover:bg-[var(--brand-soft)]
                hover:text-[var(--brand)]
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
                      bg-[var(--brand)]
                      px-1
                      text-[9px]
                      font-black
                      leading-none
                      text-white
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
