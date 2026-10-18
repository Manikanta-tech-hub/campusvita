"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";

import useStallDiscovery from "@/hooks/useStallDiscovery";
import {
  collectCategories,
  computeCapabilities,
  DEFAULT_FILTERS,
  QUICK_PICKUP_MINUTES,
  runDiscovery,
  type DiscoveryFilters,
  type DiscoverySort,
} from "@/app/lib/stallDiscovery";

import { StallCard22 } from "@/components/ui/card-22";
import { StallGridSkeleton } from "@/components/stalls/StallCardSkeleton";
import {
  StallDiscoveryError,
  StallEmptyState,
} from "@/components/stalls/StallDiscoveryStates";
import StallSearchInput from "@/components/stalls/StallSearchInput";
import StallFilterChips, {
  type ChipDefinition,
  type PrimaryChipId,
} from "@/components/stalls/StallFilterChips";
import StallSortSelect from "@/components/stalls/StallSortSelect";
import StallFilterDrawer from "@/components/stalls/StallFilterDrawer";
import { CategoryPills } from "@/components/stalls/StallCategorySelector";

/* =========================================================
   "YOUR CAMPUS, YOUR CRAVINGS" — HOMEPAGE DISCOVERY SECTION

   Visual hierarchy (locked):
     heading → subtitle → search + filter icon → filter chips
     → result count / sort → stall grid → Explore CTA

   Every chip, sort and metadata value is driven by real API
   data — unsupported options render disabled with an
   explanation instead of being faked. Category filtering is
   available through the advanced filter drawer (real food
   categories only).
========================================================= */

const HOMEPAGE_LIMIT = 6;

/** Builds /stalls query params so active state survives navigation. */
function buildStallsHref(filters: DiscoveryFilters): string {
  const params = new URLSearchParams();

  if (filters.query.trim()) params.set("q", filters.query.trim());
  if (filters.openNow) params.set("open", "1");
  if (filters.vegetarian) params.set("veg", "1");
  if (filters.nonVeg) params.set("nonveg", "1");
  if (filters.quickPickup) params.set("quick", "1");
  if (filters.topRated) params.set("top", "1");
  if (filters.category) params.set("category", filters.category);

  const query = params.toString();
  return query ? `/stalls?${query}` : "/stalls";
}

export default function StallDiscoverySection() {
  const { stalls, loading, error, retry } = useStallDiscovery();

  const [filters, setFilters] = useState<DiscoveryFilters>({
    ...DEFAULT_FILTERS,
  });
  const [sort, setSort] = useState<DiscoverySort>("recommended");

  const capabilities = useMemo(() => computeCapabilities(stalls), [stalls]);
  const categories = useMemo(() => collectCategories(stalls), [stalls]);

  const results = useMemo(
    () => runDiscovery(stalls, filters, sort, capabilities),
    [stalls, filters, sort, capabilities]
  );

  const visible = results.slice(0, HOMEPAGE_LIMIT);

  /* --------------------------------------------------
      PRIMARY CHIPS (fixed order)
      Labels: All · Veg · NonVeg · QuickGrab · Open Now · Top Rated
  -------------------------------------------------- */

  const chips: ChipDefinition[] = [
    { id: "all", label: "All", enabled: true },
    {
      id: "veg",
      label: "Veg",
      enabled: capabilities.anyVegData,
      disabledReason:
        "Menu data for current stalls doesn't include veg classification",
    },
    {
      id: "nonveg",
      label: "NonVeg",
      enabled: capabilities.anyVegData,
      disabledReason:
        "Menu data for current stalls doesn't include veg classification",
    },
    {
      id: "quick",
      label: "QuickGrab",
      enabled: capabilities.anyPrepTime,
      disabledReason: `Pickup estimates aren't available for current stalls (QuickGrab = ${QUICK_PICKUP_MINUTES} min or less)`,
    },
    { id: "open", label: "Open Now", enabled: true },
    {
      id: "top",
      label: "Top Rated",
      enabled: capabilities.anyRating,
      disabledReason: "No ratings available for current stalls yet",
    },
  ];

  const selectedChips: PrimaryChipId[] = ([
    ["open", filters.openNow],
    ["quick", filters.quickPickup],
    ["veg", filters.vegetarian],
    ["nonveg", filters.nonVeg],
    ["top", filters.topRated],
  ] as const)
    .filter(([, active]) => active)
    .map(([id]) => id);

  const hasActiveChip = selectedChips.length > 0;

  const handleChipChange = (id: PrimaryChipId) => {
    if (id === "all") {
      setFilters((previous) => ({
        ...previous,
        openNow: false,
        quickPickup: false,
        vegetarian: false,
        nonVeg: false,
        topRated: false,
      }));
      return;
    }

    setFilters((previous) => ({
      ...previous,
      openNow: id === "open" ? !previous.openNow : previous.openNow,
      quickPickup: id === "quick" ? !previous.quickPickup : previous.quickPickup,
      vegetarian: id === "veg" ? !previous.vegetarian : previous.vegetarian,
      nonVeg: id === "nonveg" ? !previous.nonVeg : previous.nonVeg,
      topRated: id === "top" ? !previous.topRated : previous.topRated,
    }));
  };

  const enabledSorts: DiscoverySort[] = [
    "recommended",
    "name",
    "open",
    ...(capabilities.anyPrepTime ? (["pickup"] as DiscoverySort[]) : []),
    ...(capabilities.anyRating ? (["rating"] as DiscoverySort[]) : []),
  ];

  /* --------------------------------------------------
      EMPTY STATE KIND
  -------------------------------------------------- */

  const hasQuery = filters.query.trim().length > 0;
  const hasCategory = Boolean(filters.category);

  const emptyKind: "no-stalls" | "no-search-results" | "no-filter-matches" | "none-open" | null =
    loading || error || results.length > 0
      ? null
      : stalls.length === 0
        ? "no-stalls"
        : filters.openNow && !hasQuery && !hasCategory && !filters.quickPickup && !filters.vegetarian && !filters.nonVeg && !filters.topRated
          ? "none-open"
          : hasQuery
            ? "no-search-results"
            : "no-filter-matches";

  const clearPrimaryFilters = () => {
    setFilters((previous) => ({
      ...previous,
      openNow: false,
      quickPickup: false,
      vegetarian: false,
      nonVeg: false,
      topRated: false,
      category: null,
      query: "",
    }));
  };

  /* --------------------------------------------------
      RENDER
  -------------------------------------------------- */

  return (
    <section
      aria-labelledby="campus-cravings-heading"
      className="relative pb-16 pt-0 sm:pb-20 sm:pt-4 lg:pt-6"
    >
      {/* Hairline section divider */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent"
      />

      <div className="relative z-[1] mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10">
        {/* --------------------------------------------------
            HEADER — left-aligned
        -------------------------------------------------- */}

        <div className="max-w-2xl">
          <h2
            id="campus-cravings-heading"
            className="text-3xl font-bold leading-[1.08] tracking-[-0.035em] text-[var(--text-primary)] sm:text-4xl"
          >
            Your Campus,{" "}
            <span className="text-[var(--accent-text)]">Your Cravings.</span>
          </h2>

          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
            Discover your favorite campus food stalls.
          </p>

        </div>

        {/* --------------------------------------------------
            SEARCH + ADVANCED FILTER (same row)
        -------------------------------------------------- */}

        <div className="mt-6 flex items-center gap-2.5">
          <StallSearchInput
            value={filters.query}
            onChange={(query) => setFilters((previous) => ({ ...previous, query }))}
            placeholder="Search stalls or dishes..."
            label="Search stalls or dishes"
            className="min-w-0 flex-1"
          />

          <div className="relative shrink-0">
            <StallFilterDrawer
              variant="icon"
              filters={filters}
              onChange={setFilters}
              categories={categories}
              capabilities={capabilities}
            />
          </div>
        </div>

        {/* --------------------------------------------------
            QUICK FILTERS
        -------------------------------------------------- */}

        <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Quick filters
        </p>

        <StallFilterChips
          chips={chips}
          selected={hasActiveChip ? selectedChips : ["all"]}
          onChange={handleChipChange}
          className="mt-2"
        />

        {/* --------------------------------------------------
            BROWSE BY FOOD — same state as the filter drawer
        -------------------------------------------------- */}

        {categories.length > 0 && (
          <>
            <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Browse by food
            </p>

            <CategoryPills
              categories={categories}
              active={filters.category}
              allLabel="All foods"
              onChange={(category) =>
                setFilters((previous) => ({ ...previous, category }))
              }
              className="mt-2"
            />
          </>
        )}

        {/* --------------------------------------------------
            RESULT COUNT + SORT (floating popover)
        -------------------------------------------------- */}

        <div className="mt-6 flex items-center justify-between gap-3">
          <p
            aria-live="polite"
            className="cv-tnum text-sm font-medium text-[var(--text-secondary)]"
          >
            {loading
              ? "Loading stalls…"
              : error
                ? "Stalls unavailable"
                : `Available stalls · ${results.length}`}
          </p>

          <StallSortSelect
            value={sort}
            onChange={setSort}
            enabledSorts={enabledSorts}
            className="shrink-0"
          />
        </div>

        {/* --------------------------------------------------
            STALL GRID
        -------------------------------------------------- */}

        <div className="mt-4">
          {loading && <StallGridSkeleton count={6} />}

          {error && !loading && (
            <StallDiscoveryError onRetry={retry} message={error} />
          )}

          {!loading && !error && results.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
              {visible.map((stall) => (
                  <StallCard22 key={stall.id} stall={stall} />
              ))}
            </div>
          )}

          {!loading && !error && emptyKind && (
            <StallEmptyState
              kind={emptyKind}
              query={filters.query}
              onClear={clearPrimaryFilters}
            />
          )}
        </div>

        {/* --------------------------------------------------
            EXPLORE ALL STALLS
        -------------------------------------------------- */}

        {!loading && !error && results.length > 0 && (
          <div className="mt-6 flex justify-center sm:mt-8">
            <Link
              href={buildStallsHref(filters)}
              className="group inline-flex h-11 items-center gap-2 rounded-full bg-[var(--primary)] px-6 text-sm font-semibold text-[var(--on-primary)] transition-all duration-150 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
            >
              Explore All Campus Stalls
              <ArrowRight
                size={16}
                aria-hidden="true"
                className="transition-transform duration-150 group-hover:translate-x-0.5"
              />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
