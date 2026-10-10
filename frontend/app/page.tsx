"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BurgerScroll from "@/components/home/BurgerScroll";
import {
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Search,
  ShoppingCart,
  Store,
  UtensilsCrossed,
  X,
} from "lucide-react";

import { getImageUrl } from "@/app/lib/getImageUrl";
import FindYourCraving from "@/components/home/FindYourCraving";
import FeaturedCollection from "@/components/home/FeaturedCollection";
import StallCard from "@/components/ui/cards-1";
import Footer from "@/components/home/Footer";
import HomeNavbar from "@/components/layout/HomeNavbar";
import { getAccessToken } from "@/app/lib/auth/session";
import { useCart } from "@/context/CartContext";

import {
  requestNotificationPermission,
  listenNotifications,
} from "./notifications";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

type Stall = {
  _id: string;
  name: string;
  image: string;
  description: string;
  is_open: boolean;
  active: boolean;
  rating?: number;
  preparation_time?: string | number;
};

export default function Home() {
  const router = useRouter();

  // ============================================================
  // STATE
  // ============================================================

  const [stalls, setStalls] = useState<Stall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // ============================================================
  // CART
  // ============================================================

  const { cartItems } = useCart();

  const cartItemCount = useMemo(() => {
    return cartItems.reduce(
      (total, item) => total + Number(item.quantity || 0),
      0
    );
  }, [cartItems]);

  const cartLabel = cartItemCount === 1 ? "item" : "items";

  // ============================================================
  // AUTHENTICATION
  // ============================================================

  useEffect(() => {
    const token = getAccessToken("USER");

    if (!token) {
      window.location.replace("/login");
    }
  }, []);

  // ============================================================
  // LOAD STALLS
  // ============================================================

  const loadStalls = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await fetch(`${API_URL}/stalls`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(
            `Failed to fetch stalls: ${response.status}`
          );
        }

        const data = await response.json();

        console.log("🏪 Live stalls:", data);

        if (!Array.isArray(data?.stalls)) {
          throw new Error("Invalid stalls response from server");
        }

        setStalls(data.stalls);
      } catch (err) {
        console.error("❌ Failed to load stalls:", err);

        setError(
          "We couldn't load the campus stalls right now. Please try again."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadStalls();
  }, [loadStalls]);

  // ============================================================
  // NOTIFICATIONS
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    const setupNotifications = async () => {
      try {
        await requestNotificationPermission();

        if (!cancelled) {
          listenNotifications();
        }
      } catch (notificationError) {
        console.log(
          "Notification setup error:",
          notificationError
        );
      }
    };

    void setupNotifications();

    return () => {
      cancelled = true;
    };
  }, []);

  // ============================================================
  // REAL STALL DATA
  // ============================================================

  const activeStalls = useMemo(() => {
    return stalls.filter((stall) => stall.active !== false);
  }, [stalls]);

  const openStalls = useMemo(() => {
    return activeStalls.filter((stall) => stall.is_open);
  }, [activeStalls]);

  // ============================================================
  // SEARCH
  // ============================================================

  const filteredStalls = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return activeStalls;
    }

    return activeStalls.filter((stall) => {
      const stallName = stall.name?.toLowerCase() ?? "";
      const stallDescription =
        stall.description?.toLowerCase() ?? "";

      return (
        stallName.includes(query) ||
        stallDescription.includes(query)
      );
    });
  }, [activeStalls, searchQuery]);

  const hasSearch = searchQuery.trim().length > 0;

  // ============================================================
  // STALL NAVIGATION
  // ============================================================

  const handleStallClick = (stall: Stall) => {
    if (!stall.is_open) {
      return;
    }

    router.push(
      `/stall/${encodeURIComponent(stall._id)}`
    );
  };

  // ============================================================
  // CLEAR SEARCH
  // ============================================================

  const clearSearch = () => {
    setSearchQuery("");
  };

  // ============================================================
  // CART
  // ============================================================

  const handleOpenCart = () => {
    router.push("/cart");
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <main
        className="
          min-h-screen
          bg-[var(--background)]
          text-[var(--text-primary)]
          transition-colors
          duration-200
        "
      >
        <HomeNavbar />

        <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-5 sm:px-6 sm:pt-8 lg:px-10">
          <HomeSkeleton />
        </div>
      </main>
    );
  }

  // ============================================================
  // HOME
  // ============================================================

  return (
    <main
      className="
        min-h-screen
        overflow-x-clip
        bg-[var(--background)]
        text-[var(--text-primary)]
        selection:bg-brand/20
        transition-colors
        duration-200
      "
    >
      <HomeNavbar />

      <BurgerScroll />

      {/* ========================================================
          MAIN CONTENT
          ======================================================== */}

      <div className="mx-auto w-full max-w-7xl px-4 pb-32 pt-5 sm:px-6 sm:pt-8 lg:px-10">

        {/* ======================================================
            TOP INTRO
            ====================================================== */}

        <section className="mb-6">
          <div className="flex flex-col gap-5 sm:gap-6 lg:flex-row lg:items-end lg:justify-between">

            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.35)]" />

                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Campus dining
                </span>
              </div>

              <h1
                className="
                  max-w-3xl
                  text-[clamp(2rem,5vw,3.8rem)]
                  font-black
                  leading-[0.98]
                  tracking-[-0.04em]
                  text-[var(--text-primary)]
                "
              >
                What are you{" "}
                <span className="text-[var(--brand)]">
                  craving?
                </span>
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
                Explore the food stalls on campus and order
                directly from the places serving right now.
              </p>
            </div>

            {/* LIVE STATUS */}

            <div
              className="
                flex
                shrink-0
                items-center
                gap-2
                self-start
                rounded-full
                border
                border-[var(--border)]
                bg-[var(--surface)]
                px-3.5
                py-2.5
                shadow-[var(--shadow-soft)]
                lg:self-end
              "
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-30" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
              </span>

              <span className="text-xs font-semibold text-[var(--text-secondary)]">
                Live availability
              </span>
            </div>
          </div>
        </section>

        {/* ======================================================
            SEARCH
            ====================================================== */}

        <section className="mb-7">
          <div className="relative">
            <Search
              size={21}
              strokeWidth={2}
              className="
                pointer-events-none
                absolute
                left-4
                top-1/2
                -translate-y-1/2
                text-[var(--text-muted)]
                sm:left-5
              "
              aria-hidden="true"
            />

            <input
              type="search"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              placeholder="Search stalls or food descriptions..."
              aria-label="Search campus food stalls"
              className="
                h-14
                w-full
                rounded-2xl
                border
                border-[var(--border)]
                bg-[var(--surface)]
                pl-12
                pr-12
                text-sm
                text-[var(--text-primary)]
                shadow-[var(--shadow-soft)]
                outline-none
                transition-all
                duration-200
                placeholder:text-[var(--text-muted)]
                hover:border-[var(--border-strong)]
                focus:border-[var(--brand)]
                focus:ring-4
                focus:ring-brand/10
                sm:h-16
                sm:pl-14
                sm:text-base
              "
            />

            {hasSearch && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="
                  absolute
                  right-3
                  top-1/2
                  flex
                  h-9
                  w-9
                  -translate-y-1/2
                  items-center
                  justify-center
                  rounded-xl
                  text-[var(--text-muted)]
                  transition-colors
                  hover:bg-[var(--surface-secondary)]
                  hover:text-[var(--text-primary)]
                  focus:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-[var(--brand)]
                  sm:right-4
                "
              >
                <X size={18} />
              </button>
            )}
          </div>

          {hasSearch && (
            <div className="mt-3 flex items-center justify-between px-1">
              <p className="text-xs text-[var(--text-muted)]">
                {filteredStalls.length}{" "}
                {filteredStalls.length === 1
                  ? "stall"
                  : "stalls"}{" "}
                found
              </p>

              <button
                type="button"
                onClick={clearSearch}
                className="
                  text-xs
                  font-semibold
                  text-[var(--brand)]
                  transition-colors
                  hover:text-[var(--brand-hover)]
                "
              >
                Clear
              </button>
            </div>
          )}
        </section>

        {/* ======================================================
            HERO
            ====================================================== */}

        {/* ======================================================
            ERROR / RETRY
            ====================================================== */}

        {error && (
          <section
            role="alert"
            className="
              mb-8
              overflow-hidden
              rounded-2xl
              border
              border-red-200
              bg-red-50
              dark:border-red-900/50
              dark:bg-red-950/20
            "
          >
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-500/10">
                  <AlertCircle
                    size={19}
                    className="text-red-600 dark:text-red-400"
                  />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-red-700 dark:text-red-300">
                    Something went wrong
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-red-600/80 dark:text-red-400/80 sm:text-sm">
                    {error}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void loadStalls(true)}
                disabled={refreshing}
                className="
                  inline-flex
                  h-10
                  shrink-0
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  border-red-200
                  bg-white
                  px-4
                  text-xs
                  font-semibold
                  text-red-700
                  transition-all
                  hover:bg-red-50
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  focus:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-red-500
                  dark:border-red-900/60
                  dark:bg-red-950/30
                  dark:text-red-300
                  dark:hover:bg-red-900/30
                "
              >
                <RefreshCw
                  size={15}
                  className={
                    refreshing
                      ? "animate-spin"
                      : ""
                  }
                />

                Try again
              </button>
            </div>
          </section>
        )}

        {/* NEW SECTIONS BELOW HERO */}
        <FindYourCraving stalls={activeStalls} />
        <FeaturedCollection />

        {/* Discover campus food */}
        <section className="mb-12">
          <h2 className="mb-2 text-3xl font-black tracking-[-0.03em] text-[var(--text-primary)]">Your Campus, Your Cravings</h2>
          <p className="mb-6 text-sm text-[var(--text-secondary)]">Discover the best food stalls around your campus.</p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {activeStalls.slice(0, 6).map((stall) => (
              <StallCard
                key={stall._id}
                _id={stall._id}
                name={stall.name}
                image={stall.image ? getImageUrl(stall.image) : undefined}
                description={stall.description || ""}
                cuisine={stall.description ? undefined : undefined}
                rating={stall.rating || undefined}
                preparationTime={stall.preparation_time ? String(stall.preparation_time) : undefined}
                priceMin={undefined}
                priceMax={undefined}
                isOpen={stall.is_open}
              />
            ))}
          </div>
        </section>



      </div>

      {/* ========================================================
          FLOATING CART
          ======================================================== */}

      {cartItemCount > 0 && (
        <div
          className="
            fixed
            bottom-[76px]
            right-4
            z-50
            sm:right-6
            md:bottom-6
          "
        >
          <button
            type="button"
            onClick={handleOpenCart}
            aria-label={`Open cart with ${cartItemCount} ${cartLabel}`}
            className="
              group
              flex
              h-[58px]
              min-w-[142px]
              items-center
              rounded-2xl
              border
              border-brand/30
              bg-[var(--brand)]
              px-3
              text-white
              shadow-[0_16px_45px_rgba(104,110,232,0.22)]
              transition-all
              duration-200
              hover:-translate-y-0.5
              hover:bg-[var(--brand-hover)]
              hover:shadow-[0_20px_50px_rgba(104,110,232,0.30)]
              active:scale-[0.97]
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-brand
              focus-visible:ring-offset-2
              focus-visible:ring-offset-[var(--background)]
            "
          >
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center">
              <ShoppingCart
                size={22}
                strokeWidth={2.2}
              />

              <span
                className="
                  absolute
                  -right-1
                  -top-1
                  flex
                  h-[18px]
                  min-w-[18px]
                  items-center
                  justify-center
                  rounded-full
                  border-2
                  border-[var(--brand)]
                  bg-white
                  px-1
                  text-[9px]
                  font-black
                  leading-none
                  text-brand-hover
                "
              >
                {cartItemCount}
              </span>
            </div>

            <div className="ml-1 flex min-w-0 flex-1 flex-col items-start justify-center leading-none">
              <span className="text-[13px] font-bold">
                Cart
              </span>

              <span className="mt-1.5 text-[10px] font-medium text-white/75">
                {cartItemCount} {cartLabel}
              </span>
            </div>

            <ArrowRight
              size={18}
              strokeWidth={2.5}
              className="ml-2 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </button>
        </div>
      )}

      <Footer />
    </main>
  );
}


/* ================================================================
   HERO STAT
================================================================ */

function HeroStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div
      className="
        inline-flex
        items-center
        gap-2.5
        rounded-full
        border
        border-black/10
        bg-white/75
        px-3.5
        py-2
        shadow-sm
        backdrop-blur-md
        dark:border-white/10
        dark:bg-black/35
      "
    >
      <span className="text-[var(--brand)]">
        {icon}
      </span>

      <span className="text-xs font-bold text-zinc-950 dark:text-white">
        {value}
      </span>

      <span className="text-xs text-zinc-600 dark:text-white/65">
        {label}
      </span>
    </div>
  );
}

/* ================================================================
   EMPTY STALLS
================================================================ */

function EmptyStallsState() {
  return (
    <div
      className="
        rounded-[28px]
        border
        border-[var(--border)]
        bg-[var(--surface)]
        p-8
        text-center
        shadow-[var(--shadow-card)]
        sm:p-12
      "
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--surface-secondary)]">
        <Store
          size={28}
          className="text-[var(--text-muted)]"
        />
      </div>

      <h3 className="mt-5 text-xl font-bold text-[var(--text-primary)]">
        No active stalls right now
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
        There are currently no active food stalls
        available on campus. Please check again later.
      </p>
    </div>
  );
}

/* ================================================================
   SEARCH EMPTY
================================================================ */

function SearchEmptyState({
  query,
  onClear,
}: {
  query: string;
  onClear: () => void;
}) {
  return (
    <div
      className="
        rounded-[28px]
        border
        border-[var(--border)]
        bg-[var(--surface)]
        p-8
        text-center
        shadow-[var(--shadow-card)]
        sm:p-12
      "
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--surface-secondary)]">
        <Search
          size={28}
          className="text-[var(--text-muted)]"
        />
      </div>

      <h3 className="mt-5 text-xl font-bold text-[var(--text-primary)]">
        No stalls found
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
        Nothing matched{" "}
        <span className="font-semibold text-[var(--text-primary)]">
          &quot;{query}&quot;
        </span>
        .
      </p>

      <button
        type="button"
        onClick={onClear}
        className="
          mt-5
          inline-flex
          h-10
          items-center
          justify-center
          rounded-xl
          bg-[var(--brand)]
          px-4
          text-sm
          font-semibold
          text-white
          shadow-[0_10px_25px_rgba(104,110,232,0.2)]
          transition-all
          hover:-translate-y-0.5
          hover:bg-[var(--brand-hover)]
          focus:outline-none
          focus-visible:ring-2
          focus-visible:ring-brand
          focus-visible:ring-offset-2
          focus-visible:ring-offset-[var(--background)]
        "
      >
        Clear search
      </button>
    </div>
  );
}

/* ================================================================
   HOME SKELETON
================================================================ */

function HomeSkeleton() {
  return (
    <div
      className="animate-pulse"
      aria-label="Loading campus food"
      aria-busy="true"
    >
      {/* INTRO */}

      <div className="mb-6">
        <div className="h-3 w-28 rounded-full bg-[var(--surface-secondary)]" />

        <div className="mt-3 h-10 w-72 max-w-full rounded-xl bg-[var(--surface-secondary)] sm:h-14 sm:w-[460px]" />

        <div className="mt-3 h-4 w-full max-w-xl rounded-full bg-[var(--surface-secondary)]" />
      </div>

      {/* SEARCH */}

      <div className="mb-7 h-14 rounded-2xl bg-[var(--surface)] ring-1 ring-[var(--border)] sm:h-16" />

      {/* HERO */}

      <div className="mb-8 h-[280px] rounded-[28px] bg-[var(--surface-secondary)] sm:h-[320px] lg:h-[350px]" />

      {/* SECTION HEADER */}

      <div className="mb-5 flex items-end justify-between">
        <div>
          <div className="h-7 w-56 rounded-lg bg-[var(--surface-secondary)]" />
          <div className="mt-2 h-3 w-64 rounded-full bg-[var(--surface-secondary)]" />
        </div>

        <div className="h-10 w-20 rounded-xl bg-[var(--surface-secondary)]" />
      </div>

      {/* CARDS */}

      <div
  className="
    grid
    grid-cols-1
    gap-5
    sm:grid-cols-2
    lg:grid-cols-3
    xl:grid-cols-4
    xl:gap-6
  "
>
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="
              overflow-hidden
              rounded-[24px]
              border
              border-[var(--border)]
              bg-[var(--surface)]
            "
          >
            <div className="aspect-[16/10] bg-[var(--surface-secondary)]" />

            <div className="space-y-3 p-5">
              <div className="h-5 w-3/4 rounded-md bg-[var(--surface-secondary)]" />

              <div className="h-3 w-full rounded-full bg-[var(--surface-secondary)]" />

              <div className="h-3 w-2/3 rounded-full bg-[var(--surface-secondary)]" />

              <div className="mt-4 h-8 w-full rounded-lg bg-[var(--surface-secondary)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}