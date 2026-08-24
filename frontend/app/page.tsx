"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  MapPin,
  Search,
  UtensilsCrossed,
  X,
} from "lucide-react";

import { getImageUrl } from "@/app/lib/getImageUrl";
import Navbar from "@/components/layout/Navbar";
import { getAccessToken } from "@/app/lib/auth/session";

import {
  requestNotificationPermission,
  listenNotifications,
} from "./notifications";

type Stall = {
  _id: string;
  name: string;
  image: string;
  description: string;
  is_open: boolean;
  active: boolean;
};

export default function Home() {
  const router = useRouter();

  const [stalls, setStalls] = useState<Stall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // ============================================================
  // AUTH + STALL DATA
  // ============================================================

  useEffect(() => {
    const token = getAccessToken("USER");

    if (!token) {
      window.location.replace("/login");
      return;
    }

    void fetchStalls();
  }, []);

  const fetchStalls = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://127.0.0.1:8000/stalls",
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch stalls: ${response.status}`
        );
      }

      const data = await response.json();

      console.log("🏪 Live stalls:", data);

      if (!Array.isArray(data?.stalls)) {
        throw new Error(
          "Invalid stalls response from server"
        );
      }

      setStalls(data.stalls);
    } catch (err) {
      console.error(
        "❌ Failed to load stalls:",
        err
      );

      setError(
        "Unable to load food stalls."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // NOTIFICATIONS
  // ============================================================

  useEffect(() => {
    const setupNotifications = async () => {
      try {
        await requestNotificationPermission();
        listenNotifications();
      } catch (error) {
        console.log(
          "Notification error:",
          error
        );
      }
    };

    void setupNotifications();
  }, []);

  // ============================================================
  // REAL BACKEND DATA
  // ============================================================

  const activeStalls = useMemo(() => {
    return stalls.filter(
      (stall) => stall.active !== false
    );
  }, [stalls]);

  const openStalls = useMemo(() => {
    return activeStalls.filter(
      (stall) => stall.is_open
    );
  }, [activeStalls]);

  // ============================================================
  // SEARCH
  //
  // Search only uses the real stalls already received
  // from the backend. No fake or duplicate data is created.
  // ============================================================

  const filteredStalls = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return activeStalls;
    }

    return activeStalls.filter((stall) => {
      const stallName =
        stall.name?.toLowerCase() ?? "";

      const stallDescription =
        stall.description?.toLowerCase() ?? "";

      return (
        stallName.includes(query) ||
        stallDescription.includes(query)
      );
    });
  }, [activeStalls, searchQuery]);

  // ============================================================
  // PREMIUM HOME BANNER
  // ============================================================

  const heroImage =
    "/images/campus-canteen-banner.jpeg";

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
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="px-6 text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-zinc-800 border-t-orange-500" />

          <p className="text-sm text-zinc-400">
            Loading food stalls...
          </p>
        </div>
      </main>
    );
  }

  // ============================================================
  // HOME
  // ============================================================

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="mx-auto w-full max-w-7xl px-4 pb-28 pt-5 sm:px-6 sm:pb-32 sm:pt-8 lg:px-10">

        {/* ======================================================
            SEARCH BOX
            ====================================================== */}

        <section className="mb-5">
          <div className="relative">
            <Search
              size={20}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
            />

            <input
              type="search"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              placeholder="Search food stalls..."
              aria-label="Search food stalls"
              className="h-14 w-full rounded-2xl border border-zinc-800 bg-zinc-950 pl-12 pr-12 text-sm text-white outline-none transition-all placeholder:text-zinc-600 focus:border-orange-500/70 focus:ring-2 focus:ring-orange-500/10"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-white"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* LIVE SEARCH RESULT COUNT */}

          {searchQuery.trim() && (
            <div className="mt-2 px-1">
              <p className="text-xs text-zinc-500">
                {filteredStalls.length}{" "}
                {filteredStalls.length === 1
                  ? "stall"
                  : "stalls"}{" "}
                found
              </p>
            </div>
          )}
        </section>

        {/* ======================================================
            PREMIUM HERO BANNER
            ====================================================== */}

        <section className="mb-9">
          <div className="group relative isolate overflow-hidden rounded-[28px] border border-zinc-800/80 bg-zinc-950 shadow-2xl shadow-black/40">

            {/* ==================================================
                REAL LOCAL BANNER IMAGE
                ================================================== */}

            <img
              src={heroImage}
              alt="Campus canteen"
              className="absolute inset-0 z-0 h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.025]"
              onError={(event) => {
                console.error(
                  "❌ CampusVita banner image failed to load:",
                  heroImage
                );

                event.currentTarget.style.display =
                  "none";
              }}
            />

            {/* ==================================================
                IMAGE DARK OVERLAY
                ================================================== */}

            <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-black/90 via-black/65 to-black/20" />

            <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/10 to-black/10" />

            {/* ==================================================
                HERO CONTENT
                ================================================== */}

            <div className="relative z-20 flex min-h-[210px] flex-col justify-center px-6 py-8 sm:min-h-[240px] sm:px-9 sm:py-10 lg:min-h-[270px] lg:px-12">

              {/* CAMPUS CANTEEN LABEL */}

              <div className="mb-4 flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 backdrop-blur-md">

                  <MapPin
                    size={13}
                    className="text-orange-400"
                  />

                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/90 sm:text-xs">
                    Campus Canteen
                  </span>

                </div>
              </div>

              {/* ==================================================
                  REAL DYNAMIC STALL COUNT
                  ================================================== */}

              <h1 className="max-w-2xl text-3xl font-black leading-[1.05] tracking-tight text-white sm:text-4xl lg:text-5xl">
                Delicious food from{" "}
                <span className="text-orange-400">
                  {activeStalls.length}
                </span>{" "}
                {activeStalls.length === 1
                  ? "amazing stall"
                  : "amazing stalls"}
              </h1>

              {/* DESCRIPTION */}

              <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-200 sm:text-base">
                Discover fresh food, explore menus,
                and order directly from your campus
                food stalls.
              </p>

              {/* ==================================================
                  REAL OPEN STALL COUNT
                  ================================================== */}

              <div className="mt-5 flex flex-wrap items-center gap-3">

                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-2 backdrop-blur-md">

                  <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />

                  <span className="text-xs font-medium text-white/90">
                    {openStalls.length}{" "}
                    {openStalls.length === 1
                      ? "stall"
                      : "stalls"}{" "}
                    accepting orders
                  </span>

                </div>

                <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-2 backdrop-blur-md sm:flex">

                  <UtensilsCrossed
                    size={13}
                    className="text-orange-400"
                  />

                  <span className="text-xs font-medium text-white/80">
                    Fresh campus food
                  </span>

                </div>

              </div>
            </div>
          </div>
        </section>

        {/* ======================================================
            ERROR
            ====================================================== */}

        {error && (
          <div className="mb-7 rounded-2xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* ======================================================
            ALL STALLS
            ====================================================== */}

        <section>
          {/* STALL HEADER */}

          <div className="mb-5 flex items-end justify-between gap-4 sm:mb-6">

            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {searchQuery.trim()
                  ? "Search Results"
                  : "All Stalls"}
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                {searchQuery.trim()
                  ? "Matching food stalls from campus"
                  : "Select a stall to explore its menu"}
              </p>
            </div>

            {/* REAL RESULT / STALL COUNT */}

            <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1.5">
              <span className="text-sm font-semibold text-zinc-300">
                {searchQuery.trim()
                  ? filteredStalls.length
                  : activeStalls.length}
              </span>

              <span className="text-xs text-zinc-600">
                {searchQuery.trim()
                  ? filteredStalls.length === 1
                    ? "result"
                    : "results"
                  : activeStalls.length === 1
                    ? "stall"
                    : "stalls"}
              </span>
            </div>
          </div>

          {/* ====================================================
              EMPTY STATE
              ==================================================== */}

          {activeStalls.length === 0 && !error && (
            <div className="rounded-[28px] border border-zinc-800 bg-zinc-950 p-10 text-center shadow-xl">

              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900">
                <UtensilsCrossed
                  size={28}
                  className="text-zinc-600"
                />
              </div>

              <h3 className="text-xl font-semibold text-white">
                No food stalls available
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                There are currently no active food
                stalls available.
              </p>

            </div>
          )}

          {/* ====================================================
              SEARCH EMPTY STATE
              ==================================================== */}

          {activeStalls.length > 0 &&
            searchQuery.trim() &&
            filteredStalls.length === 0 && (
              <div className="rounded-[28px] border border-zinc-800 bg-zinc-950 p-10 text-center shadow-xl">

                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900">
                  <Search
                    size={28}
                    className="text-zinc-600"
                  />
                </div>

                <h3 className="text-xl font-semibold text-white">
                  No stalls found
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                  No active food stall matches{" "}
                  <span className="font-medium text-zinc-300">
                    "{searchQuery.trim()}"
                  </span>
                  .
                </p>

                <button
                  type="button"
                  onClick={clearSearch}
                  className="mt-5 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-400"
                >
                  Clear Search
                </button>

              </div>
            )}

          {/* ====================================================
              REAL STALL GRID
              ==================================================== */}

          {filteredStalls.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">

              {filteredStalls.map((stall) => {
                const isOpen = stall.is_open;

                return (
                  <button
                    key={stall._id}
                    type="button"
                    disabled={!isOpen}
                    onClick={() =>
                      handleStallClick(stall)
                    }
                    aria-label={
                      isOpen
                        ? `Open ${stall.name}`
                        : `${stall.name} is closed`
                    }
                    className={`group relative overflow-hidden rounded-[22px] border text-left outline-none transition-all duration-300 ${
                      isOpen
                        ? "cursor-pointer border-zinc-800 bg-zinc-900 hover:-translate-y-1 hover:border-orange-500/70 hover:shadow-xl hover:shadow-orange-500/10 focus-visible:ring-2 focus-visible:ring-orange-500"
                        : "cursor-not-allowed border-zinc-900 bg-zinc-950"
                    }`}
                  >

                    {/* ==================================================
                        STALL IMAGE
                        ================================================== */}

                    <div className="relative aspect-square w-full overflow-hidden bg-zinc-950">

                      {stall.image ? (
                        <img
                          src={getImageUrl(
                            stall.image
                          )}
                          alt={stall.name}
                          loading="lazy"
                          className={`h-full w-full object-cover transition-all duration-500 ${
                            isOpen
                              ? "group-hover:scale-105"
                              : "brightness-[0.2] grayscale"
                          }`}
                        />
                      ) : (
                        <div
                          className={`flex h-full w-full items-center justify-center ${
                            isOpen
                              ? "bg-zinc-900"
                              : "bg-black"
                          }`}
                        >
                          <UtensilsCrossed
                            size={38}
                            className={
                              isOpen
                                ? "text-zinc-600"
                                : "text-zinc-800"
                            }
                          />
                        </div>
                      )}

                      {/* IMAGE GRADIENT */}

                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                      {/* ==================================================
                          OPEN / CLOSED STATUS
                          ================================================== */}

                      <div
                        className={`absolute right-2.5 top-2.5 flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-bold shadow-lg backdrop-blur-md sm:right-3 sm:top-3 sm:px-3 sm:text-xs ${
                          isOpen
                            ? "bg-green-500/95 text-white"
                            : "bg-zinc-800/95 text-zinc-300"
                        }`}
                      >

                        <span
                          className={`h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2 ${
                            isOpen
                              ? "bg-white"
                              : "bg-red-500"
                          }`}
                        />

                        {isOpen
                          ? "Open"
                          : "Closed"}

                      </div>
                    </div>

                    {/* ==================================================
                        STALL INFORMATION
                        ================================================== */}

                    <div className="p-3.5 sm:p-4">

                      <div className="flex items-start justify-between gap-2">

                        <h3
                          className={`line-clamp-1 text-sm font-bold sm:text-base ${
                            isOpen
                              ? "text-white"
                              : "text-zinc-500"
                          }`}
                        >
                          {stall.name}
                        </h3>

                        {isOpen && (
                          <ChevronRight
                            size={17}
                            className="mt-0.5 shrink-0 text-zinc-600 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-orange-400"
                          />
                        )}

                      </div>

                      {/* REAL DESCRIPTION */}

                      {stall.description && (
                        <p
                          className={`mt-1.5 line-clamp-2 text-[11px] leading-4 sm:text-xs ${
                            isOpen
                              ? "text-zinc-500"
                              : "text-zinc-700"
                          }`}
                        >
                          {stall.description}
                        </p>
                      )}

                      {/* ==================================================
                          ORDER STATUS
                          ================================================== */}

                      <div className="mt-3 flex items-center gap-1.5">

                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isOpen
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        />

                        <span
                          className={`text-[10px] font-medium leading-4 sm:text-xs ${
                            isOpen
                              ? "text-green-400"
                              : "text-zinc-600"
                          }`}
                        >
                          {isOpen
                            ? "Accepting orders"
                            : "Currently closed"}
                        </span>

                      </div>
                    </div>
                  </button>
                );
              })}

            </div>
          )}
        </section>

        {/* ======================================================
            BOTTOM CONTEXT
            ====================================================== */}

        {activeStalls.length > 0 && (
          <div className="mt-10 flex items-center justify-center gap-2 text-center">

            <div className="h-px w-8 bg-zinc-800" />

            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-700">
              Campus food • Live availability
            </span>

            <div className="h-px w-8 bg-zinc-800" />

          </div>
        )}

      </div>
    </main>
  );
}