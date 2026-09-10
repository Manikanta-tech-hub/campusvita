"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  Search,
  ShoppingCart,
  Star,
  Store,
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

  /*
   * ============================================================
   * LIVE CART
   * ============================================================
   *
   * Everything here comes directly from CartContext.
   *
   * There is no separate cart state on this page.
   * ============================================================
   */

  const {
    cartItems,
    addToCart,
    increaseQuantity,
    decreaseQuantity,
  } = useCart();

  const [data, setData] =
    useState<StallFoodsResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("ALL");

  const [selectedFoodType, setSelectedFoodType] =
    useState<"ALL" | "VEG" | "NON_VEG">("ALL");

  /*
   * ============================================================
   * LOAD STALL
   * ============================================================
   */

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
          `${API_URL}/stalls/${encodeURIComponent(
            stallId
          )}/foods`,
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

        if (
          !result.success ||
          !result.stall
        ) {
          throw new Error(
            "Invalid stall response"
          );
        }

        setData(result);
      } catch (err) {
        console.error(
          "Failed to load stall:",
          err
        );

        setError(
          "Unable to load this stall."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadStall();
  }, [stallId]);

  /*
   * ============================================================
   * CATEGORIES
   * ============================================================
   */

  const categories = useMemo(() => {
    if (!data) return [];

    return Array.from(
      new Set(
        data.foods
          .map((food) =>
            food.category?.trim()
          )
          .filter(Boolean)
      )
    );
  }, [data]);

  /*
   * ============================================================
   * FILTER FOODS
   * ============================================================
   */

  const filteredFoods = useMemo(() => {
    if (!data) return [];

    const normalizedSearch =
      search.trim().toLowerCase();

    return data.foods.filter((food) => {
      const matchesCategory =
        selectedCategory === "ALL" ||
        food.category === selectedCategory;

      const matchesFoodType =
        selectedFoodType === "ALL" ||
        (selectedFoodType === "VEG" &&
          food.is_veg === true) ||
        (selectedFoodType === "NON_VEG" &&
          food.is_veg === false);

      const matchesSearch =
        !normalizedSearch ||
        food.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        food.description
          .toLowerCase()
          .includes(normalizedSearch);

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

  /*
   * ============================================================
   * GET LIVE FOOD QUANTITY
   * ============================================================
   */

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

  /*
   * ============================================================
   * CART ACTIONS
   * ============================================================
   */

  const handleAddToCart = (
    food: Food
  ) => {
    if (!food.available) return;

    addToCart({
      name: food.name,
      price: food.price,
      image: food.image,
      stall_id: food.stall_id,
    });
  };

  const handleIncreaseQuantity = (
    food: Food
  ) => {
    increaseQuantity(
      food.name,
      food.stall_id
    );
  };

  const handleDecreaseQuantity = (
    food: Food
  ) => {
    decreaseQuantity(
      food.name,
      food.stall_id
    );
  };

  /*
   * ============================================================
   * LIVE CART ITEM COUNT
   * ============================================================
   *
   * This is calculated from the actual CartContext.
   *
   * Example:
   *
   * Mango Juice x1
   * Strawberry Juice x2
   *
   * Cart = 3 items
   * ============================================================
   */

  const cartItemCount = useMemo(() => {
    return cartItems.reduce(
      (total, item) =>
        total + Number(item.quantity || 0),
      0
    );
  }, [cartItems]);

  const cartLabel =
    cartItemCount === 1
      ? "item"
      : "items";

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-zinc-700 border-t-orange-500" />

            <p className="text-sm text-zinc-400">
              Loading stall menu...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /*
   * ============================================================
   * ERROR
   * ============================================================
   */

  if (error || !data) {
    return (
      <main className="min-h-screen bg-black px-4 py-8 text-white">
        <div className="mx-auto max-w-3xl">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-8 flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-10 text-center">
            <Store
              className="mx-auto mb-4 text-zinc-600"
              size={48}
            />

            <h1 className="text-xl font-semibold">
              Unable to load this stall
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              {error ||
                "The requested stall could not be found."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const stall = data.stall;

  return (
    <main className="min-h-screen bg-black text-white pb-24">
      {/* ========================================================
          STALL HEADER
          ======================================================== */}

      <section className="border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-5 flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
          >
            <ArrowLeft size={18} />
            Back to stalls
          </button>

          <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900">
            <div className="relative h-56 sm:h-72 lg:h-80">
              {stall.image ? (
                <img
                  src={getImageUrl(stall.image)}
                  alt={stall.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-zinc-900">
                  <Store
                    size={70}
                    className="text-zinc-700"
                  />
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      stall.is_open
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {stall.is_open
                      ? "OPEN"
                      : "CLOSED"}
                  </span>

                  {stall.rating !== null && (
                    <span className="flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">
                      <Star
                        size={13}
                        fill="currentColor"
                        className="text-yellow-400"
                      />

                      {stall.rating}
                    </span>
                  )}
                </div>

                <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
                  {stall.name}
                </h1>

                {stall.description && (
                  <p className="mt-2 max-w-2xl text-sm text-zinc-300 sm:text-base">
                    {stall.description}
                  </p>
                )}

                {stall.preparation_time && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-zinc-300">
                    <Clock3 size={16} />

                    Preparation:{" "}
                    {stall.preparation_time}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          MENU
          ======================================================== */}

      <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              Menu
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              {data.total} food{" "}
              {data.total === 1
                ? "item"
                : "items"}
            </p>
          </div>

          {/* SEARCH */}

          <div className="relative w-full sm:max-w-sm">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search food..."
              className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-10 pr-4 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-orange-500"
            />
          </div>
        </div>

        {/* ======================================================
            FOOD TYPE FILTERS
            ====================================================== */}

        <div className="mb-5">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              type="button"
              onClick={() =>
                setSelectedFoodType("ALL")
              }
              className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                selectedFoodType === "ALL"
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                  : "border border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              All
            </button>

            <button
              type="button"
              onClick={() =>
                setSelectedFoodType("VEG")
              }
              className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                selectedFoodType === "VEG"
                  ? "border border-green-500/40 bg-green-500/15 text-green-400"
                  : "border border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              🟢 Veg
            </button>

            <button
              type="button"
              onClick={() =>
                setSelectedFoodType("NON_VEG")
              }
              className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                selectedFoodType === "NON_VEG"
                  ? "border border-red-500/40 bg-red-500/15 text-red-400"
                  : "border border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              🔴 Non-Veg
            </button>
          </div>
        </div>

        {/* ======================================================
            CATEGORIES
            ====================================================== */}

        {categories.length > 0 && (
          <div className="mb-7 flex gap-2 overflow-x-auto pb-2">
            <button
              type="button"
              onClick={() =>
                setSelectedCategory("ALL")
              }
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                selectedCategory === "ALL"
                  ? "bg-orange-500 text-white"
                  : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              All
            </button>

            {categories.map(
              (category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() =>
                    setSelectedCategory(
                      category
                    )
                  }
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    selectedCategory ===
                    category
                      ? "bg-orange-500 text-white"
                      : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  {category}
                </button>
              )
            )}
          </div>
        )}

        {/* ======================================================
            FOOD GRID
            ====================================================== */}

        {filteredFoods.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-950 p-12 text-center">
            <div className="text-5xl">
              🍽️
            </div>

            <h3 className="mt-4 text-lg font-semibold">
              No food items found
            </h3>

            <p className="mt-2 text-sm text-zinc-500">
              Try another search or
              category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredFoods.map(
              (food) => {
                const quantity =
                  getQuantity(
                    food.name,
                    food.stall_id
                  );

                return (
                  <div
                    key={food._id}
                    className={`relative ${
                      !food.available
                        ? "opacity-60"
                        : ""
                    }`}
                  >
                    <FoodCard
                      name={food.name}
                      price={food.price}
                      image={food.image}
                      quantity={quantity}
                      isVeg={food.is_veg}
                      onAddToCart={() =>
                        handleAddToCart(food)
                      }
                      onIncrease={() =>
                        handleIncreaseQuantity(
                          food
                        )
                      }
                      onDecrease={() =>
                        handleDecreaseQuantity(
                          food
                        )
                      }
                    />

                    {/* OUT OF STOCK */}

                    {!food.available && (
                      <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/80 px-3 py-1 text-xs font-semibold text-red-400">
                        Out of stock
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>
        )}
      </section>

      {/* ========================================================
          COMPACT FLOATING CART
          ========================================================

          Matches the Home Page style:

          ┌─────────────────────────┐
          │ 🛒  Cart             →  │
          │     1 item              │
          └─────────────────────────┘

          The values are completely LIVE from CartContext.
          ======================================================== */}

      {cartItemCount > 0 && (
        <div className="fixed bottom-5 right-4 z-50 sm:bottom-6 sm:right-6">
          <button
            type="button"
            onClick={() =>
              router.push("/cart")
            }
            aria-label={`Open cart with ${cartItemCount} ${cartLabel}`}
            className="
              group
              flex
              h-[58px]
              w-[142px]
              items-center
              rounded-[16px]
              bg-orange-500
              px-3
              text-white
              shadow-lg
              shadow-orange-500/25
              transition-all
              duration-200
              hover:bg-orange-400
              active:scale-[0.97]
            "
          >
            {/* ==================================================
                CART ICON
                ================================================== */}

            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center">
              <ShoppingCart
                size={22}
                strokeWidth={2.2}
              />

              {/* LIVE ITEM COUNT BADGE */}

              <span
                className="
                  absolute
                  -right-1
                  -top-1
                  flex
                  h-[17px]
                  min-w-[17px]
                  items-center
                  justify-center
                  rounded-full
                  bg-white
                  px-1
                  text-[9px]
                  font-bold
                  leading-none
                  text-orange-500
                "
              >
                {cartItemCount}
              </span>
            </div>

            {/* ==================================================
                CART TEXT
                ================================================== */}

            <div className="ml-1 flex min-w-0 flex-1 flex-col items-start justify-center leading-none">
              <span className="text-[13px] font-bold">
                Cart
              </span>

              <span className="mt-[5px] text-[10px] font-medium text-white/80">
                {cartItemCount} {cartLabel}
              </span>
            </div>

            {/* ==================================================
                ARROW
                ================================================== */}

            <ArrowRight
              size={18}
              strokeWidth={2.5}
              className="ml-1 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </button>
        </div>
      )}
    </main>
  );
}