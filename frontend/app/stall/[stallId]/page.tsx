"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Search,
  ShoppingCart,
  Star,
  Store,
  UtensilsCrossed,
  X,
} from "lucide-react";

import FoodCard from "@/components/home/FoodCard";
import { getImageUrl } from "@/app/lib/getImageUrl";
import { useCart } from "@/context/CartContext";

type Stall = {
  _id: string;
  name: string;
  image: string;
  description: string;
  is_open: boolean;
  active: boolean;
  rating: number | null;
  opening_time: string | null;
  closing_time: string | null;
  preparation_time: string | null;
};

type Food = {
  _id: string;
  name: string;
  price: number;
  category: string;
  category_id: string;
  stall_id: string;
  image: string;
  description: string;
  available: boolean;
  is_veg: boolean | null;
};

type StallFoodsResponse = {
  success: boolean;
  stall: Stall;
  foods: Food[];
  total: number;
};

export default function StallPage() {
  const params = useParams();
  const router = useRouter();

  const stallId = String(params?.stallId ?? "");

  const {
    cartItems,
    addToCart,
    increaseQuantity,
    decreaseQuantity,
  } = useCart();

  const [data, setData] = useState<StallFoodsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedFoodType, setSelectedFoodType] = useState<
    "ALL" | "VEG" | "NON_VEG"
  >("ALL");

  useEffect(() => {
    if (!stallId) return;

    const loadStall = async () => {
      try {
        setLoading(true);
        setError("");

        const API_URL =
          process.env.NEXT_PUBLIC_API_URL ||
          "http://127.0.0.1:8000";

        const response = await fetch(
          `${API_URL}/stalls/${encodeURIComponent(stallId)}/foods`,
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
            `Failed to load stall (${response.status})`
          );
        }

        const result: StallFoodsResponse =
          await response.json();

        if (!result.success || !result.stall) {
          throw new Error("Invalid stall response");
        }

        setData(result);
      } catch (err) {
        console.error("Failed to load stall:", err);
        setError("Unable to load this stall.");
      } finally {
        setLoading(false);
      }
    };

    void loadStall();
  }, [stallId]);

  const categories = useMemo(() => {
    if (!data) return [];

    return Array.from(
      new Set(
        data.foods
          .map((food) => food.category?.trim())
          .filter(Boolean)
      )
    );
  }, [data]);

  const filteredFoods = useMemo(() => {
    if (!data) return [];

    const normalizedSearch = search.trim().toLowerCase();

    return data.foods.filter((food) => {
      const matchesCategory =
        selectedCategory === "ALL" ||
        food.category === selectedCategory;

      const matchesFoodType =
        selectedFoodType === "ALL" ||
        (selectedFoodType === "VEG" && food.is_veg === true) ||
        (selectedFoodType === "NON_VEG" && food.is_veg === false);

      const matchesSearch =
        !normalizedSearch ||
        food.name.toLowerCase().includes(normalizedSearch) ||
        food.description.toLowerCase().includes(normalizedSearch);

      return (
        matchesCategory &&
        matchesFoodType &&
        matchesSearch
      );
    });
  }, [
    data,
    search,
    selectedCategory,
    selectedFoodType,
  ]);

  const getQuantity = (
    foodName: string,
    foodStallId: string
  ) => {
    return (
      cartItems.find(
        (item) =>
          item.name === foodName &&
          item.stall_id === foodStallId
      )?.quantity ?? 0
    );
  };

  const handleAddToCart = (food: Food) => {
    if (!food.available) return;

    addToCart({
      name: food.name,
      price: food.price,
      image: food.image,
      stall_id: food.stall_id,
    });
  };

  const handleIncreaseQuantity = (food: Food) => {
    increaseQuantity(food.name, food.stall_id);
  };

  const handleDecreaseQuantity = (food: Food) => {
    decreaseQuantity(food.name, food.stall_id);
  };

  const cartItemCount = useMemo(() => {
    return cartItems.reduce(
      (total, item) => total + Number(item.quantity || 0),
      0
    );
  }, [cartItems]);

  const cartLabel =
    cartItemCount === 1 ? "item" : "items";

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("ALL");
    setSelectedFoodType("ALL");
  };

  const hasFilters =
    search.trim().length > 0 ||
    selectedCategory !== "ALL" ||
    selectedFoodType !== "ALL";

  if (loading) {
    return <StallPageSkeleton />;
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-[var(--background)] px-4 py-6 text-[var(--text-primary)] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <button
            type="button"
            onClick={() => router.back()}
            className="
              inline-flex
              items-center
              gap-2
              text-sm
              font-semibold
              text-[var(--text-secondary)]
              transition-colors
              hover:text-[var(--text-primary)]
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-[var(--brand)]
            "
          >
            <ArrowLeft size={17} />
            Back to stalls
          </button>

          <div className="mt-8 border-t border-[var(--border)] pt-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-secondary)] text-[var(--text-muted)]">
              <Store size={27} strokeWidth={1.8} />
            </div>

            <h1 className="mt-5 text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Unable to load this stall
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
              {error ||
                "The requested stall could not be found."}
            </p>

            <button
              type="button"
              onClick={() => router.back()}
              className="
                mt-6
                inline-flex
                h-10
                items-center
                gap-2
                rounded-xl
                bg-[var(--brand)]
                px-4
                text-sm
                font-bold
                text-white
                transition-all
                hover:bg-[var(--brand-hover)]
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-[var(--brand)]
              "
            >
              <ArrowLeft size={16} />
              Return to stalls
            </button>
          </div>
        </div>
      </main>
    );
  }

  const stall = data.stall;

  return (
    <main className="min-h-screen overflow-x-clip bg-[var(--background)] pb-28 text-[var(--text-primary)]">

      {/* =====================================================
          BACK NAVIGATION
      ===================================================== */}

      <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="
            group
            inline-flex
            items-center
            gap-2
            text-sm
            font-semibold
            text-[var(--text-secondary)]
            transition-colors
            hover:text-[var(--text-primary)]
            focus:outline-none
            focus-visible:ring-2
            focus-visible:ring-[var(--brand)]
          "
        >
          <ArrowLeft
            size={17}
            className="transition-transform group-hover:-translate-x-0.5"
          />
          Back to stalls
        </button>
      </div>

      {/* =====================================================
          STALL HEADER
      ===================================================== */}

      <section className="mx-auto w-full max-w-7xl px-4 pb-8 pt-4 sm:px-6 sm:pt-5 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">

          {/* HERO IMAGE */}

          <div className="relative h-[230px] sm:h-[310px] lg:h-[370px]">
            {stall.image ? (
              <img
                src={getImageUrl(stall.image)}
                alt={stall.name}
                className="h-full w-full object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = "none";

                  const fallback =
                    event.currentTarget.parentElement?.querySelector(
                      "[data-stall-fallback]"
                    );

                  if (fallback instanceof HTMLElement) {
                    fallback.classList.remove("hidden");
                  }
                }}
              />
            ) : null}

            <div
              data-stall-fallback
              className={`
                ${
                  stall.image ? "hidden" : "flex"
                }
                absolute
                inset-0
                items-center
                justify-center
                bg-[var(--surface-secondary)]
              `}
            >
              <Store
                size={48}
                strokeWidth={1.4}
                className="text-[var(--text-muted)]"
              />
            </div>

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7 lg:p-9">

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`
                    inline-flex
                    items-center
                    gap-2
                    rounded-full
                    px-3
                    py-1.5
                    text-[11px]
                    font-bold
                    backdrop-blur-md
                    ${
                      stall.is_open
                        ? "bg-emerald-500 text-white"
                        : "bg-black/60 text-white/80"
                    }
                  `}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      stall.is_open
                        ? "bg-white"
                        : "bg-red-400"
                    }`}
                  />

                  {stall.is_open
                    ? "Open now"
                    : "Closed"}
                </span>

                {stall.rating !== null && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-md">
                    <Star
                      size={12}
                      fill="currentColor"
                      className="text-yellow-400"
                    />

                    {stall.rating}
                  </span>
                )}
              </div>

              <h1 className="mt-3 max-w-4xl text-[clamp(2rem,5vw,3.6rem)] font-black leading-none tracking-[-0.045em] text-white">
                {stall.name}
              </h1>

              {stall.description && (
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75 sm:text-base">
                  {stall.description}
                </p>
              )}
            </div>
          </div>

          {/* STALL INFORMATION */}

          <div className="grid divide-y divide-[var(--border)] sm:grid-cols-2 sm:divide-x sm:divide-y-0">

            <StallMeta
              icon={<CheckCircle2 size={17} />}
              label="Availability"
              value={
                stall.is_open
                  ? "Accepting orders"
                  : "Currently closed"
              }
              positive={stall.is_open}
            />

            <StallMeta
              icon={<Clock3 size={17} />}
              label="Preparation time"
              value={
                stall.preparation_time ||
                "Not specified"
              }
            />

          </div>
        </div>
      </section>

      {/* =====================================================
          MENU
      ===================================================== */}

      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* MENU TITLE + SEARCH */}

        <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 lg:flex-row lg:items-end lg:justify-between">

          <div>
            <div className="flex items-center gap-2">
              <UtensilsCrossed
                size={18}
                className="text-[var(--brand)]"
              />

              <h2 className="text-2xl font-black tracking-[-0.03em] text-[var(--text-primary)] sm:text-3xl">
                Menu
              </h2>

              <span className="text-sm font-medium text-[var(--text-muted)]">
                {data.total}
              </span>
            </div>

            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Explore everything available from this stall.
            </p>
          </div>

          {/* SEARCH */}

          <div className="relative w-full lg:max-w-[360px]">
            <Search
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search dishes..."
              aria-label="Search food items"
              className="
                h-11
                w-full
                rounded-xl
                border
                border-[var(--border)]
                bg-[var(--input)]
                pl-10
                pr-10
                text-sm
                font-medium
                text-[var(--text-primary)]
                outline-none
                transition-all
                placeholder:text-[var(--text-muted)]
                hover:border-[var(--border-strong)]
                focus:border-[var(--brand)]
                focus:ring-4
                focus:ring-orange-500/10
              "
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear food search"
                className="
                  absolute
                  right-1.5
                  top-1/2
                  flex
                  h-8
                  w-8
                  -translate-y-1/2
                  items-center
                  justify-center
                  rounded-lg
                  text-[var(--text-muted)]
                  transition-colors
                  hover:bg-[var(--surface-secondary)]
                  hover:text-[var(--text-primary)]
                  focus:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-[var(--brand)]
                "
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* ===================================================
            COMPACT FILTERS
        =================================================== */}

        <div className="py-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">

            <CompactFilter
              active={selectedFoodType === "ALL"}
              onClick={() =>
                setSelectedFoodType("ALL")
              }
            >
              All
            </CompactFilter>

            <CompactFilter
              active={selectedFoodType === "VEG"}
              onClick={() =>
                setSelectedFoodType("VEG")
              }
              dot="green"
            >
              Veg
            </CompactFilter>

            <CompactFilter
              active={selectedFoodType === "NON_VEG"}
              onClick={() =>
                setSelectedFoodType("NON_VEG")
              }
              dot="red"
            >
              Non-Veg
            </CompactFilter>

            {categories.length > 0 && (
              <>
                <span className="mx-1 h-5 w-px shrink-0 bg-[var(--border)]" />

                <CompactFilter
                  active={selectedCategory === "ALL"}
                  onClick={() =>
                    setSelectedCategory("ALL")
                  }
                >
                  All
                </CompactFilter>

                {categories.map((category) => (
                  <CompactFilter
                    key={category}
                    active={
                      selectedCategory === category
                    }
                    onClick={() =>
                      setSelectedCategory(category)
                    }
                  >
                    {category}
                  </CompactFilter>
                ))}
              </>
            )}

          </div>
        </div>

        {/* RESULTS */}

        <div className="mb-5 flex min-h-5 items-center justify-between gap-4">

          <p className="text-xs text-[var(--text-muted)]">
            {hasFilters ? (
              <>
                <span className="font-bold text-[var(--text-primary)]">
                  {filteredFoods.length}
                </span>{" "}
                {filteredFoods.length === 1
                  ? "item"
                  : "items"}{" "}
                found
              </>
            ) : (
              <>
                {filteredFoods.length}{" "}
                {filteredFoods.length === 1
                  ? "item"
                  : "items"}
              </>
            )}
          </p>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="
                shrink-0
                text-xs
                font-bold
                text-[var(--brand)]
                transition-colors
                hover:text-[var(--brand-hover)]
                focus:outline-none
                focus-visible:underline
              "
            >
              Clear filters
            </button>
          )}
        </div>

        {/* ===================================================
            FOOD GRID
        =================================================== */}

        {filteredFoods.length === 0 ? (
          <div className="border-t border-[var(--border)] py-20 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-secondary)]">
              <Search
                size={25}
                className="text-[var(--text-muted)]"
              />
            </div>

            <h3 className="mt-5 text-lg font-bold text-[var(--text-primary)]">
              No dishes found
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">
              Try another search or remove one of the
              selected filters.
            </p>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="
                  mt-5
                  text-sm
                  font-bold
                  text-[var(--brand)]
                  transition-colors
                  hover:text-[var(--brand-hover)]
                "
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-3.5 gap-y-7 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-9 lg:grid-cols-4 xl:grid-cols-5">

            {filteredFoods.map((food) => {
              const quantity = getQuantity(
                food.name,
                food.stall_id
              );

              return (
                <FoodCard
                  key={food._id}
                  name={food.name}
                  price={food.price}
                  image={food.image}
                  quantity={quantity}
                  isVeg={food.is_veg}
                  onAddToCart={() =>
                    handleAddToCart(food)
                  }
                  onIncrease={() =>
                    handleIncreaseQuantity(food)
                  }
                  onDecrease={() =>
                    handleDecreaseQuantity(food)
                  }
                />
              );
            })}

          </div>
        )}
      </section>

      {/* =====================================================
          FLOATING CART
      ===================================================== */}

      {cartItemCount > 0 && (
        <div className="fixed bottom-5 right-4 z-50 sm:right-6">

          <button
            type="button"
            onClick={() => router.push("/cart")}
            aria-label={`Open cart with ${cartItemCount} ${cartLabel}`}
            className="
              group
              flex
              h-14
              min-w-[145px]
              items-center
              rounded-2xl
              bg-[var(--brand)]
              px-3
              text-white
              shadow-[0_14px_38px_rgba(249,115,22,0.28)]
              transition-all
              duration-200
              hover:-translate-y-0.5
              hover:bg-[var(--brand-hover)]
              active:scale-[0.97]
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-[var(--brand)]
              focus-visible:ring-offset-2
              focus-visible:ring-offset-[var(--background)]
            "
          >
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center">

              <ShoppingCart
                size={21}
                strokeWidth={2.2}
              />

              <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-[var(--brand)] bg-white px-1 text-[9px] font-black leading-none text-orange-600">
                {cartItemCount}
              </span>

            </div>

            <div className="ml-1 flex min-w-0 flex-1 flex-col items-start justify-center">

              <span className="text-[13px] font-bold">
                View cart
              </span>

              <span className="mt-1 text-[10px] font-medium text-white/75">
                {cartItemCount} {cartLabel}
              </span>

            </div>

            <ArrowRight
              size={17}
              strokeWidth={2.5}
              className="ml-2 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </button>

        </div>
      )}
    </main>
  );
}

/* ============================================================
   STALL META
============================================================ */

function StallMeta({
  icon,
  label,
  value,
  positive = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 sm:px-6">

      <div
        className={`
          flex
          h-9
          w-9
          shrink-0
          items-center
          justify-center
          rounded-xl
          ${
            positive
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-[var(--surface-secondary)] text-[var(--text-muted)]"
          }
        `}
      >
        {icon}
      </div>

      <div className="min-w-0">

        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
          {label}
        </p>

        <p
          className={`
            mt-0.5
            truncate
            text-sm
            font-semibold
            ${
              positive
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-[var(--text-primary)]"
            }
          `}
        >
          {value}
        </p>

      </div>
    </div>
  );
}

/* ============================================================
   COMPACT FILTER
============================================================ */

function CompactFilter({
  children,
  active,
  onClick,
  dot,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  dot?: "green" | "red";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex
        h-9
        shrink-0
        items-center
        gap-1.5
        rounded-full
        border
        px-3.5
        text-xs
        font-semibold
        transition-all
        focus:outline-none
        focus-visible:ring-2
        focus-visible:ring-[var(--brand)]
        ${
          active
            ? "border-[var(--brand)] bg-[var(--brand)] text-white"
            : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
        }
      `}
    >
      {dot && (
        <span
          className={`
            h-1.5
            w-1.5
            rounded-full
            ${
              dot === "green"
                ? "bg-green-500"
                : "bg-red-500"
            }
          `}
        />
      )}

      {children}
    </button>
  );
}

/* ============================================================
   LOADING SKELETON
============================================================ */

function StallPageSkeleton() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">

      <div className="mx-auto w-full max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">

        <div className="h-5 w-28 animate-pulse rounded bg-[var(--surface-secondary)]" />

        <div className="mt-5 overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)]">

          <div className="h-[230px] animate-pulse bg-[var(--surface-secondary)] sm:h-[310px] lg:h-[370px]" />

          <div className="grid divide-y divide-[var(--border)] sm:grid-cols-2 sm:divide-x sm:divide-y-0">

            <div className="h-[76px] animate-pulse bg-[var(--surface)]" />

            <div className="h-[76px] animate-pulse bg-[var(--surface)]" />

          </div>
        </div>

        <div className="mt-9">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <div className="h-8 w-28 animate-pulse rounded bg-[var(--surface-secondary)]" />

              <div className="mt-2 h-4 w-60 animate-pulse rounded bg-[var(--surface-secondary)]" />
            </div>

            <div className="h-11 w-full animate-pulse rounded-xl bg-[var(--surface)] ring-1 ring-[var(--border)] sm:w-80" />

          </div>

          <div className="mt-5 flex gap-2 overflow-hidden">

            <div className="h-9 w-14 shrink-0 animate-pulse rounded-full bg-[var(--surface-secondary)]" />
            <div className="h-9 w-16 shrink-0 animate-pulse rounded-full bg-[var(--surface-secondary)]" />
            <div className="h-9 w-20 shrink-0 animate-pulse rounded-full bg-[var(--surface-secondary)]" />
            <div className="h-9 w-24 shrink-0 animate-pulse rounded-full bg-[var(--surface-secondary)]" />

          </div>

          <div className="mt-7 grid grid-cols-2 gap-x-3.5 gap-y-7 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-9 lg:grid-cols-4 xl:grid-cols-5">

            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
              >
                <div className="aspect-[4/3] animate-pulse bg-[var(--surface-secondary)]" />

                <div className="space-y-3 p-3">

                  <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--surface-secondary)]" />

                  <div className="h-3 w-full animate-pulse rounded bg-[var(--surface-secondary)]" />

                  <div className="h-8 w-1/2 animate-pulse rounded-lg bg-[var(--surface-secondary)]" />

                </div>
              </div>
            ))}

          </div>
        </div>
      </div>
    </main>
  );
}