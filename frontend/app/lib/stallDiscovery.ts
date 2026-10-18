/* =========================================================
   CAMPUSVITA — STALL DISCOVERY DATA LAYER
   Shared fetching, caching, filtering and sorting used by
   the homepage discovery section and the /stalls page.

   REAL DATA ONLY:
   - GET /stalls           → _id, name, image, description, is_open, active
   - GET /stalls/{id}/foods (public) → stall rating/preparation_time
     + foods (name, price, category, is_veg, available, description)
   No ratings, prep times or categories are ever invented.
========================================================= */

import { getImageUrl } from "@/app/lib/getImageUrl";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

/* ---------------------------------------------------------
   TYPES
--------------------------------------------------------- */

export type StallFood = {
  name: string;
  price: number;
  category: string;
  is_veg: boolean | null;
  available: boolean;
  description?: string;
};

/** A stall after optional menu enrichment. */
export type DiscoveredStall = {
  id: string;
  name: string;
  description: string;
  image: string;
  imageUrl: string;
  isOpen: boolean;
  /** Real rating from the stall document, or null when absent. */
  rating: number | null;
  /** Real preparation time in minutes, or null when absent/unparsable. */
  prepMinutes: number | null;
  /** Unique food categories present on this stall's menu. */
  categories: string[];
  /** true when at least one veg dish exists on the menu. */
  hasVeg: boolean;
  /** true when at least one non-veg dish exists on the menu. */
  hasNonVeg: boolean;
  /** true when the stall serves veg dishes AND no non-veg dish. */
  isVegOnly: boolean;
  /** true when at least one menu item carries a real is_veg flag. */
  vegClassified: boolean;
  priceMin: number | null;
  priceMax: number | null;
  /** Sample of real dish names, used for dish-name search. */
  dishNames: string[];
  /** Whether menu enrichment completed for this stall. */
  enriched: boolean;
};

export type DiscoveryFilters = {
  query: string;
  openNow: boolean;
  quickPickup: boolean;
  vegetarian: boolean;
  nonVeg: boolean;
  topRated: boolean;
  category: string | null;
  maxPrepMinutes: number | null;
  minRating: number | null;
  priceBand: "any" | "budget" | "mid" | "premium";
};

export type DiscoverySort =
  | "recommended"
  | "name"
  | "open"
  | "pickup"
  | "rating";

export const DEFAULT_FILTERS: DiscoveryFilters = {
  query: "",
  openNow: false,
  quickPickup: false,
  vegetarian: false,
  nonVeg: false,
  topRated: false,
  category: null,
  maxPrepMinutes: null,
  minRating: null,
  priceBand: "any",
};

/** Prep time at or below this counts as "Quick Pickup". */
export const QUICK_PICKUP_MINUTES = 15;

/* ---------------------------------------------------------
   CAPABILITY FLAGS
   Which filters/sorts are meaningful depends on the data
   that actually came back from the API.
--------------------------------------------------------- */

export type DiscoveryCapabilities = {
  anyRating: boolean;
  anyPrepTime: boolean;
  anyVegData: boolean;
  anyCategory: boolean;
  anyPrice: boolean;
};

export function computeCapabilities(
  stalls: DiscoveredStall[]
): DiscoveryCapabilities {
  return {
    anyRating: stalls.some((s) => s.rating !== null),
    anyPrepTime: stalls.some((s) => s.prepMinutes !== null),
    anyVegData: stalls.some((s) => s.vegClassified),
    anyCategory: stalls.some((s) => s.categories.length > 0),
    anyPrice: stalls.some((s) => s.priceMin !== null),
  };
}

/* ---------------------------------------------------------
   RAW API SHAPES
--------------------------------------------------------- */

type RawStall = {
  _id: string;
  name?: string;
  image?: string;
  description?: string;
  is_open?: boolean;
  active?: boolean;
};

type RawFood = {
  name?: string;
  price?: number;
  category?: string;
  is_veg?: boolean | null;
  available?: boolean;
  description?: string;
};

type RawStallFoodsResponse = {
  stall?: {
    rating?: number | null;
    preparation_time?: string | number | null;
  };
  foods?: RawFood[];
};

/* ---------------------------------------------------------
   PARSING HELPERS
--------------------------------------------------------- */

function parsePrepMinutes(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.round(value);
  }

  if (typeof value === "string") {
    const match = value.match(/(\d+(?:\.\d+)?)/);

    if (match) {
      const parsed = Number(match[1]);

      if (Number.isFinite(parsed) && parsed > 0) {
        return Math.round(parsed);
      }
    }
  }

  return null;
}

function parseRating(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.min(5, value);
  }

  return null;
}

function toBaseStall(raw: RawStall): DiscoveredStall {
  return {
    id: String(raw._id),
    name: (raw.name ?? "").trim(),
    description: (raw.description ?? "").trim(),
    image: (raw.image ?? "").trim(),
    imageUrl: getImageUrl((raw.image ?? "").trim()),
    isOpen: Boolean(raw.is_open),
    rating: null,
    prepMinutes: null,
    categories: [],
    hasVeg: false,
    hasNonVeg: false,
    isVegOnly: false,
    vegClassified: false,
    priceMin: null,
    priceMax: null,
    dishNames: [],
    enriched: false,
  };
}

function enrichStall(
  stall: DiscoveredStall,
  response: RawStallFoodsResponse
): DiscoveredStall {
  const foods: RawFood[] = Array.isArray(response.foods) ? response.foods : [];

  const categorySet = new Set<string>();
  const dishNames: string[] = [];
  const prices: number[] = [];
  let vegCount = 0;
  let nonVegCount = 0;

  for (const food of foods) {
    const category = (food.category ?? "").trim();

    if (category) {
      categorySet.add(category);
    }

    const dishName = (food.name ?? "").trim();

    if (dishName && food.available !== false && dishNames.length < 24) {
      dishNames.push(dishName);
    }

    if (typeof food.price === "number" && food.price > 0) {
      prices.push(food.price);
    }

    if (food.is_veg === true) {
      vegCount += 1;
    } else if (food.is_veg === false) {
      nonVegCount += 1;
    }
  }

  const hasMenu = foods.length > 0;

  return {
    ...stall,
    rating: parseRating(response.stall?.rating),
    prepMinutes: parsePrepMinutes(response.stall?.preparation_time),
    categories: Array.from(categorySet).sort((a, b) => a.localeCompare(b)),
    hasVeg: vegCount > 0,
    hasNonVeg: nonVegCount > 0,
    isVegOnly: hasMenu && vegCount > 0 && nonVegCount === 0,
    vegClassified: vegCount + nonVegCount > 0,
    priceMin: prices.length ? Math.min(...prices) : null,
    priceMax: prices.length ? Math.max(...prices) : null,
    dishNames,
    enriched: true,
  };
}

/* ---------------------------------------------------------
   MODULE-LEVEL CACHE
   Shared between the homepage section and /stalls so
   navigating between them never refetches the catalog.
--------------------------------------------------------- */

const CACHE_TTL_MS = 5 * 60 * 1000;

type CacheEntry<T> = { value: T; expiresAt: number };

const stallCache = new Map<string, CacheEntry<DiscoveredStall[]>>();

function readCache(key: string): DiscoveredStall[] | null {
  const entry = stallCache.get(key);

  if (!entry) {
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    stallCache.delete(key);
    return null;
  }

  return entry.value;
}

function writeCache(key: string, value: DiscoveredStall[]) {
  stallCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

export function invalidateStallCache() {
  stallCache.clear();
}

/* ---------------------------------------------------------
   FETCHING
--------------------------------------------------------- */

async function fetchJson<T>(url: string, timeoutMs = 12000): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

/**
 * Run an async mapper over items with a concurrency limit.
 * Used to enrich stalls without hammering the API.
 */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const current = nextIndex;
      nextIndex += 1;
      results[current] = await mapper(items[current]);
    }
  }

  const workers = Array.from(
    { length: Math.min(limit, Math.max(1, items.length)) },
    () => worker()
  );

  await Promise.all(workers);
  return results;
}

const ENRICH_CONCURRENCY = 4;

/**
 * Load all active stalls, optionally enriching each one with its
 * real menu data (rating, prep time, categories, veg flags).
 *
 * Enrichment failures degrade gracefully: the stall is still
 * returned with enriched=false and unsupported data hidden.
 */
export async function fetchDiscoveredStalls(
  options: { enrich?: boolean; force?: boolean } = {}
): Promise<DiscoveredStall[]> {
  const { enrich = true, force = false } = options;
  const cacheKey = enrich ? "enriched" : "base";

  if (!force) {
    const cached = readCache(cacheKey);

    if (cached) {
      return cached;
    }
  }

  const data = await fetchJson<{ stalls?: RawStall[] }>(`${API_URL}/stalls`);

  if (!Array.isArray(data?.stalls)) {
    throw new Error("Invalid stalls response from server");
  }

  const baseStalls = data.stalls
    .filter((stall) => stall && stall._id)
    .map(toBaseStall);

  if (!enrich) {
    writeCache(cacheKey, baseStalls);
    return baseStalls;
  }

  // Even when enrichment is requested, keep whatever the base
  // cache already holds for stalls so retries stay cheap.
  const enriched = await mapWithConcurrency(
    baseStalls,
    ENRICH_CONCURRENCY,
    async (stall) => {
      try {
        const response = await fetchJson<RawStallFoodsResponse>(
          `${API_URL}/stalls/${encodeURIComponent(stall.id)}/foods`,
          10000
        );

        return enrichStall(stall, response);
      } catch {
        // Menu fetch failed for this stall only — show it with
        // hidden enhancements rather than failing the page.
        return stall;
      }
    }
  );

  writeCache(cacheKey, enriched);
  return enriched;
}

/* ---------------------------------------------------------
   SEARCH
--------------------------------------------------------- */

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function stallMatchesQuery(
  stall: DiscoveredStall,
  query: string
): boolean {
  const q = normalize(query);

  if (!q) {
    return true;
  }

  const haystacks = [
    stall.name,
    stall.description,
    ...stall.categories,
    ...stall.dishNames,
  ];

  return haystacks.some((entry) => entry.toLowerCase().includes(q));
}

/* ---------------------------------------------------------
   FILTERING
--------------------------------------------------------- */

export function applyFilters(
  stalls: DiscoveredStall[],
  filters: DiscoveryFilters,
  capabilities: DiscoveryCapabilities
): DiscoveredStall[] {
  return stalls.filter((stall) => {
    if (!stallMatchesQuery(stall, filters.query)) {
      return false;
    }

    if (filters.openNow && !stall.isOpen) {
      return false;
    }

    if (
      filters.quickPickup &&
      capabilities.anyPrepTime &&
      (stall.prepMinutes === null ||
        stall.prepMinutes > QUICK_PICKUP_MINUTES)
    ) {
      return false;
    }

    // Veg = the stall serves at least one real veg-flagged dish;
    // NonVeg = serves at least one real non-veg-flagged dish.
    // A stall with unclassified menus matches neither (gated by
    // anyVegData at the chip level, so it never filters silently).
    if (filters.vegetarian && capabilities.anyVegData && !stall.hasVeg) {
      return false;
    }

    if (filters.nonVeg && capabilities.anyVegData && !stall.hasNonVeg) {
      return false;
    }

    if (
      filters.topRated &&
      capabilities.anyRating &&
      (stall.rating === null ||
        (filters.minRating !== null && stall.rating < filters.minRating))
    ) {
      return false;
    }

    if (filters.category && filters.category !== "all") {
      if (!stall.categories.includes(filters.category)) {
        return false;
      }
    }

    if (
      filters.maxPrepMinutes !== null &&
      (stall.prepMinutes === null ||
        stall.prepMinutes > filters.maxPrepMinutes)
    ) {
      return false;
    }

    if (
      filters.minRating !== null &&
      (stall.rating === null || stall.rating < filters.minRating)
    ) {
      return false;
    }

    if (filters.priceBand !== "any" && stall.priceMin !== null) {
      // Bands derived from real menu prices (₹).
      if (filters.priceBand === "budget" && stall.priceMin > 50) {
        return false;
      }

      if (
        filters.priceBand === "mid" &&
        (stall.priceMin <= 50 || stall.priceMin > 120)
      ) {
        return false;
      }

      if (filters.priceBand === "premium" && stall.priceMin <= 120) {
        return false;
      }
    }

    return true;
  });
}

export function countActiveFilters(filters: DiscoveryFilters): number {
  let count = 0;

  if (filters.openNow) count += 1;
  if (filters.quickPickup) count += 1;
  if (filters.vegetarian) count += 1;
  if (filters.nonVeg) count += 1;
  if (filters.topRated) count += 1;
  if (filters.category && filters.category !== "all") count += 1;
  if (filters.maxPrepMinutes !== null) count += 1;
  if (filters.minRating !== null) count += 1;
  if (filters.priceBand !== "any") count += 1;

  return count;
}

/* ---------------------------------------------------------
   SORTING
   Recommended is deterministic and transparent:
   open first → has rating (desc) → has prep time → name asc.
--------------------------------------------------------- */

export function sortStalls(
  stalls: DiscoveredStall[],
  sort: DiscoverySort
): DiscoveredStall[] {
  const copy = [...stalls];

  switch (sort) {
    case "name":
      return copy.sort((a, b) => a.name.localeCompare(b.name));

    case "open":
      return copy.sort((a, b) => {
        if (a.isOpen !== b.isOpen) {
          return a.isOpen ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

    case "pickup":
      return copy.sort((a, b) => {
        const aPrep = a.prepMinutes ?? Number.POSITIVE_INFINITY;
        const bPrep = b.prepMinutes ?? Number.POSITIVE_INFINITY;

        if (aPrep !== bPrep) {
          return aPrep - bPrep;
        }

        return a.name.localeCompare(b.name);
      });

    case "rating":
      return copy.sort((a, b) => {
        const aRating = a.rating ?? -1;
        const bRating = b.rating ?? -1;

        if (aRating !== bRating) {
          return bRating - aRating;
        }

        return a.name.localeCompare(b.name);
      });

    case "recommended":
    default:
      return copy.sort((a, b) => {
        if (a.isOpen !== b.isOpen) {
          return a.isOpen ? -1 : 1;
        }

        const aRating = a.rating ?? -1;
        const bRating = b.rating ?? -1;

        if (aRating !== bRating) {
          return bRating - aRating;
        }

        const aPrep = a.prepMinutes ?? Number.POSITIVE_INFINITY;
        const bPrep = b.prepMinutes ?? Number.POSITIVE_INFINITY;

        if (aPrep !== bPrep) {
          return aPrep - bPrep;
        }

        return a.name.localeCompare(b.name);
      });
  }
}

/* ---------------------------------------------------------
   CATEGORIES
--------------------------------------------------------- */

export function collectCategories(stalls: DiscoveredStall[]): string[] {
  const set = new Set<string>();

  for (const stall of stalls) {
    for (const category of stall.categories) {
      set.add(category);
    }
  }

  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/* ---------------------------------------------------------
   PIPELINE
--------------------------------------------------------- */

export function runDiscovery(
  stalls: DiscoveredStall[],
  filters: DiscoveryFilters,
  sort: DiscoverySort,
  capabilities: DiscoveryCapabilities
): DiscoveredStall[] {
  return sortStalls(applyFilters(stalls, filters, capabilities), sort);
}

/* ---------------------------------------------------------
   FORMATTERS
--------------------------------------------------------- */

export function formatPriceRange(stall: DiscoveredStall): string | null {
  if (stall.priceMin === null) {
    return null;
  }

  if (
    stall.priceMax === null ||
    stall.priceMin === stall.priceMax
  ) {
    return `₹${stall.priceMin}`;
  }

  return `₹${stall.priceMin}–${stall.priceMax}`;
}

export function formatRating(rating: number | null): string | null {
  if (rating === null) {
    return null;
  }

  return rating.toFixed(1);
}

export function describeSort(sort: DiscoverySort): string {
  switch (sort) {
    case "name":
      return "Name A–Z";
    case "open":
      return "Open First";
    case "pickup":
      return "Quickest Pickup";
    case "rating":
      return "Highest Rated";
    case "recommended":
    default:
      return "Recommended";
  }
}
