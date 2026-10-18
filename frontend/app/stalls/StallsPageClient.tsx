"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Store } from "lucide-react";

import useStallDiscovery from "@/hooks/useStallDiscovery";
import {
  collectCategories,
  computeCapabilities,
  countActiveFilters,
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
import { CategorySelector } from "@/components/stalls/StallCategorySelector";
import StallFilterDrawer from "@/components/stalls/StallFilterDrawer";

/* =========================================================
   ALL CAMPUS STALLS — interactive page

   URL is the source of truth for filters/sort so results are
   shareable and browser back/forward restores state:

      ?q=&open=1&veg=1&nonveg=1&quick=1&top=1
      &category=<name>&sort=<id>
      &prep=<10|20|30>&rating=<3|4|4.5>&price=<budget|mid|premium>

   Only non-default values are written to the URL.
========================================================= */

const VALID_SORTS: DiscoverySort[] = [
  "recommended",
  "name",
  "open",
  "pickup",
  "rating",
];

const VALID_PREP = [10, 20, 30];
const VALID_RATING = [3, 4, 4.5];
const VALID_PRICE: DiscoveryFilters["priceBand"][] = [
  "any",
  "budget",
  "mid",
  "premium",
];

function readFilters(params: URLSearchParams): DiscoveryFilters {
  const prep = Number(params.get("prep"));
  const rating = Number(params.get("rating"));
  const price = params.get("price") as DiscoveryFilters["priceBand"] | null;

  return {
    query: params.get("q") ?? "",
    openNow: params.get("open") === "1",
    quickPickup: params.get("quick") === "1",
    vegetarian: params.get("veg") === "1",
    nonVeg: params.get("nonveg") === "1",
    topRated: params.get("top") === "1",
    category: params.get("category"),
    maxPrepMinutes: VALID_PREP.includes(prep) ? prep : null,
    minRating: VALID_RATING.includes(rating) ? rating : null,
    priceBand: price && VALID_PRICE.includes(price) ? price : "any",
  };
}

function readSort(params: URLSearchParams): DiscoverySort {
  const sort = params.get("sort") as DiscoverySort | null;
  return sort && VALID_SORTS.includes(sort) ? sort : "recommended";
}

function writeParams(
  filters: DiscoveryFilters,
  sort: DiscoverySort
): string {
  const params = new URLSearchParams();

  if (filters.query.trim()) params.set("q", filters.query.trim());
  if (filters.openNow) params.set("open", "1");
  if (filters.quickPickup) params.set("quick", "1");
  if (filters.vegetarian) params.set("veg", "1");
  if (filters.nonVeg) params.set("nonveg", "1");
  if (filters.topRated) params.set("top", "1");
  if (filters.category) params.set("category", filters.category);
  if (filters.maxPrepMinutes !== null)
    params.set("prep", String(filters.maxPrepMinutes));
  if (filters.minRating !== null)
    params.set("rating", String(filters.minRating));
  if (filters.priceBand !== "any") params.set("price", filters.priceBand);
  if (sort !== "recommended") params.set("sort", sort);

  return params.toString();
}

/* ---------------------------------------------------------
   PAGE
--------------------------------------------------------- */

export default function StallsPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { stalls, loading, error, retry } = useStallDiscovery();

  const [filters, setFilters] = useState<DiscoveryFilters>(() =>
    readFilters(new URLSearchParams(searchParams.toString()))
  );
  const [sort, setSort] = useState<DiscoverySort>(() =>
    readSort(new URLSearchParams(searchParams.toString()))
  );

  const writtenRef = useRef(searchParams.toString());

  /* Sync from URL on back/forward navigation */
  useEffect(() => {
    const current = searchParams.toString();

    if (current === writtenRef.current) {
      return;
    }

    writtenRef.current = current;
    const params = new URLSearchParams(current);
    setFilters(readFilters(params));
    setSort(readSort(params));
  }, [searchParams]);

  const commit = useCallback(
    (nextFilters: DiscoveryFilters, nextSort: DiscoverySort) => {
      setFilters(nextFilters);
      setSort(nextSort);

      const query = writeParams(nextFilters, nextSort);
      writtenRef.current = query;
      router.replace(query ? `/stalls?${query}` : "/stalls", {
        scroll: false,
      });
    },
    [router]
  );

  /* --------------------------------------------------
      DERIVED DATA
  -------------------------------------------------- */

  const capabilities = useMemo(() => computeCapabilities(stalls), [stalls]);
  const categories = useMemo(() => collectCategories(stalls), [stalls]);

  const results = useMemo(
    () => runDiscovery(stalls, filters, sort, capabilities),
    [stalls, filters, sort, capabilities]
  );

  const activeFilterCount = countActiveFilters(filters);

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
      commit(
        {
          ...filters,
          openNow: false,
          quickPickup: false,
          vegetarian: false,
          nonVeg: false,
          topRated: false,
        },
        sort
      );
      return;
    }

    commit(
      {
        ...filters,
        openNow: id === "open" ? !filters.openNow : filters.openNow,
        quickPickup: id === "quick" ? !filters.quickPickup : filters.quickPickup,
        vegetarian: id === "veg" ? !filters.vegetarian : filters.vegetarian,
        nonVeg: id === "nonveg" ? !filters.nonVeg : filters.nonVeg,
        topRated: id === "top" ? !filters.topRated : filters.topRated,
      },
      sort
    );
  };

  const enabledSorts: DiscoverySort[] = [
    "recommended",
    "name",
    "open",
    ...(capabilities.anyPrepTime ? (["pickup"] as DiscoverySort[]) : []),
    ...(capabilities.anyRating ? (["rating"] as DiscoverySort[]) : []),
  ];

  const clearEverything = () => {
    commit({ ...DEFAULT_FILTERS }, "recommended");
  };

  /* Empty-state classification */
  const hasQuery = filters.query.trim().length > 0;
  const emptyKind:
    | "no-stalls"
    | "no-search-results"
    | "no-filter-matches"
    | "none-open"
    | null =
    loading || error || results.length > 0
      ? null
      : stalls.length === 0
        ? "no-stalls"
        : activeFilterCount === 0 && !hasQuery && !filters.category
          ? "no-stalls"
          : filters.openNow &&
              activeFilterCount === 1 &&
              !hasQuery &&
              !filters.category
            ? "none-open"
            : hasQuery
              ? "no-search-results"
              : "no-filter-matches";

  /* --------------------------------------------------
      RENDER
  -------------------------------------------------- */

  return (
    <main className="relative min-h-screen">
      {/* --------------------------------------------------
          HERO
      -------------------------------------------------- */}

      <div className="border-b border-[var(--border)] bg-[var(--surface)]/70 pt-32 backdrop-blur-xl sm:pt-36">
        <div className="mx-auto w-full max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Back to home
          </Link>

          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                <Store size={13} strokeWidth={2.2} aria-hidden="true" />
                Discover Your Campus
              </p>

              <h1 className="mt-3 text-3xl font-semibold leading-[1.08] tracking-[-0.03em] text-[var(--text-primary)] sm:text-4xl lg:text-[2.75rem]">
                All Campus{" "}
                <span className="text-[var(--accent-text)]">Stalls</span>
              </h1>

              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)] sm:text-base sm:leading-7">
                Every stall serving on campus, in one place. Search, filter and
                jump straight to any menu.
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* --------------------------------------------------
          TOOLBAR
      -------------------------------------------------- */}

      <div className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]">
        <div className="mx-auto w-full max-w-7xl space-y-2 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <StallSearchInput
              value={filters.query}
              onChange={(query) => commit({ ...filters, query }, sort)}
              placeholder="Search stalls, dishes, or cuisines..."
              label="Search stalls, dishes, or cuisines"
              className="min-w-0 flex-1"
            />

            <StallFilterDrawer
              variant="pill"
              filters={filters}
              onChange={(next) => commit(next, sort)}
              categories={categories}
              capabilities={capabilities}
            />

            <StallSortSelect
              value={sort}
              onChange={(nextSort) => commit(filters, nextSort)}
              enabledSorts={enabledSorts}
            />
          </div>

          <div className="min-w-0">
            <StallFilterChips
              chips={chips}
              selected={hasActiveChip ? selectedChips : ["all"]}
              onChange={handleChipChange}
            />
          </div>

          {categories.length > 0 && (
            <div className="hide-scrollbar mt-2 overflow-x-auto pb-0.5">
              <CategorySelector
                categories={categories}
                active={filters.category}
                onChange={(category) =>
                  commit({ ...filters, category }, sort)
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* --------------------------------------------------
          RESULTS
      -------------------------------------------------- */}

      <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p
            aria-live="polite"
            className="cv-tnum text-sm font-medium text-[var(--text-secondary)]"
          >
            {loading
              ? "Loading stalls…"
              : error
                ? "Stalls unavailable"
                : results.length === 1
                  ? "1 stall found"
                  : `${results.length} stalls found`}
          </p>

          {!loading && !error && activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearEverything}
              className="text-xs font-semibold text-[var(--text-muted)] underline-offset-4 transition-colors hover:text-[var(--text-primary)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
            >
              Clear all filters
            </button>
          )}
        </div>

        {loading && <StallGridSkeleton count={6} />}

        {error && !loading && (
          <StallDiscoveryError onRetry={retry} message={error} />
        )}

        {!loading && !error && results.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {results.map((stall) => (
              <StallCard22 key={stall.id} stall={stall} />
            ))}
          </div>
        )}

        {!loading && !error && emptyKind && (
          <StallEmptyState
            kind={emptyKind}
            query={filters.query}
            onClear={clearEverything}
          />
        )}
      </div>
    </main>
  );
}
