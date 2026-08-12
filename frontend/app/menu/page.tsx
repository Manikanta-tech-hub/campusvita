"use client";

import { useEffect, useMemo, useState } from "react";
import { getImageUrl } from "@/app/lib/getImageUrl";
import toast from "react-hot-toast";

import {
  Search,
  SlidersHorizontal,
  ShoppingCart,
} from "lucide-react";

import Navbar from "@/components/layout/Navbar";

import { useCart } from "../../context/CartContext";

// =====================================
// TYPES
// =====================================

type Food = {
  name: string;
  price: number;
  category: string;
  image: string;
};

type CartItem = Food & {
  quantity: number;
};

// =====================================
// COMPONENT
// =====================================

export default function MenuPage() {

  const [foods, setFoods] =
    useState<Food[]>([]);

  const [loading, setLoading] =
    useState(true);

  // SEARCH

  const [search, setSearch] =
    useState("");

  // CATEGORY

  const [selectedCategory, setSelectedCategory] =
    useState("All");

  // SORT

  const [sortType, setSortType] =
    useState("default");

  const { cartItems, addToCart } =
    useCart();

  // =====================================
  // FETCH FOODS
  // =====================================

  const fetchFoods = async () => {

    try {

      const response = await fetch(
        "http://127.0.0.1:8000/foods"
      );

      const data =
        await response.json();

      setFoods(
        Array.isArray(data.foods)
          ? data.foods
          : []
      );

    } catch (error) {

      console.log(error);

      toast.error(
        "Failed To Load Foods"
      );

    } finally {

      setLoading(false);

    }

  };

  // =====================================
  // INITIAL LOAD
  // =====================================

  useEffect(() => {

    fetchFoods();

  }, []);

  // =====================================
  // CATEGORIES
  // =====================================

  const categories = useMemo(() => {

    const uniqueCategories =
      foods.map(
        (food) => food.category
      );

    return [
      "All",
      ...new Set(uniqueCategories),
    ];

  }, [foods]);

  // =====================================
  // FILTERED FOODS
  // =====================================

  const filteredFoods = useMemo(() => {

    let filtered = [...foods];

    // SEARCH

    filtered = filtered.filter(
      (food) =>
        food.name
          .toLowerCase()
          .includes(
            search.toLowerCase()
          )
    );

    // CATEGORY

    if (
      selectedCategory !== "All"
    ) {

      filtered = filtered.filter(
        (food) =>
          food.category ===
          selectedCategory
      );

    }

    // SORT

    if (sortType === "low") {

      filtered.sort(
        (a, b) =>
          a.price - b.price
      );

    }

    if (sortType === "high") {

      filtered.sort(
        (a, b) =>
          b.price - a.price
      );

    }

    return filtered;

  }, [
    foods,
    search,
    selectedCategory,
    sortType,
  ]);

  // =====================================
  // ADD TO CART
  // =====================================

  const handleAddToCart = (
    food: Food
  ) => {

    const cartItem: CartItem = {
      ...food,
      quantity: 1,
    };

    addToCart(cartItem);

    toast.success(
      `${food.name} Added To Cart 🚀`
    );

  };

  // =====================================
  // LOADING
  // =====================================

  if (loading) {

    return (

      <main className="min-h-screen bg-black text-white flex items-center justify-center">

        <h1 className="text-3xl font-bold">

          Loading Foods...

        </h1>

      </main>

    );

  }

  // =====================================
  // MAIN UI
  // =====================================

  return (

    <>
      <Navbar/>

      <main className="min-h-screen bg-black text-white p-6 md:p-10">

        <div className="max-w-7xl mx-auto">

          {/* HEADER */}

          <div>

            <h1 className="text-5xl font-bold text-orange-500">

              Explore Foods

            </h1>

            <p className="text-gray-400 mt-3 text-lg">

              Discover delicious campus meals 🍔

            </p>

          </div>

          {/* SEARCH + FILTER */}

          <div className="mt-10 flex flex-col xl:flex-row gap-6">

            {/* SEARCH */}

            <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-3xl px-6 py-5 flex items-center gap-4">

              <Search
                className="text-gray-400"
                size={24}
              />

              <input
                type="text"
                placeholder="Search foods..."
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                className="bg-transparent outline-none w-full text-lg"
              />

            </div>

            {/* SORT */}

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl px-6 py-5 flex items-center gap-4">

              <SlidersHorizontal
                size={22}
              />

              <select
                value={sortType}
                onChange={(e) =>
                  setSortType(
                    e.target.value
                  )
                }
                className="bg-transparent outline-none"
              >

                <option value="default">

                  Default

                </option>

                <option value="low">

                  Price Low → High

                </option>

                <option value="high">

                  Price High → Low

                </option>

              </select>

            </div>

          </div>

          {/* CATEGORY FILTER */}

          <div className="flex flex-wrap gap-4 mt-8">

            {categories.map(
              (category) => (

                <button
                  key={category}
                  onClick={() =>
                    setSelectedCategory(
                      category
                    )
                  }
                  className={`px-6 py-3 rounded-2xl font-bold transition-all ${
                    selectedCategory ===
                    category
                      ? "bg-orange-500 text-white"
                      : "bg-zinc-900 border border-zinc-800 hover:border-orange-500"
                  }`}
                >

                  {category}

                </button>

              )
            )}

          </div>

          {/* FOOD GRID */}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mt-12">

            {filteredFoods.length ===
            0 ? (

              <div className="col-span-full bg-zinc-900 border border-zinc-800 rounded-3xl p-10 text-center">

                <h2 className="text-3xl font-bold">

                  No Foods Found 🍔

                </h2>

              </div>

            ) : (

              filteredFoods.map(
                (food , index) => (

                  <div
                    key={food.name}
                    className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden hover:scale-[1.02] transition-all duration-300"
                  >

                    {/* IMAGE */}

                    <img
                     src={getImageUrl(food.image)}
                      alt={food.name}
                      className="w-full h-32 object-cover"
                    />

                    {/* CONTENT */}

                    <div className="p-6">

                      <div className="flex justify-between items-start gap-5">

                        <div>

                          <h2 className="text-3xl font-bold">

                            {food.name}

                          </h2>

                          <p className="text-gray-400 mt-3">

                            {
                              food.category
                            }

                          </p>

                        </div>

                        <h3 className="text-3xl font-bold text-orange-500">

                          ₹{food.price}

                        </h3>

                      </div>

                      {/* BUTTON */}

                      <button
                        onClick={() =>
                          handleAddToCart(
                            food
                          )
                        }
                        className="w-full bg-orange-500 hover:bg-orange-600 transition-all mt-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3"
                      >

                        <ShoppingCart
                          size={22}
                        />

                        Add To Cart

                      </button>

                    </div>

                  </div>

                )
              )

            )}

          </div>

        </div>

      </main>

    </>

  );

}