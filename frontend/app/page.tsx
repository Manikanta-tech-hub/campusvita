"use client";

import { useEffect, useState } from "react";

import Navbar from "@/components/layout/Navbar";

import FoodCard from "../components/home/FoodCard";

import { useCart } from "../context/CartContext";

import {
  requestNotificationPermission,
  listenNotifications,
} from "./notifications";

type Food = {
  name: string;
  price: number;
  category: string;
  image: string;
};

export default function Home() {

  const [search, setSearch] =
    useState("");

  const [foods, setFoods] =
    useState<Food[]>([]);

    const {
      cartItems,
      addToCart,
      increaseQuantity,
      decreaseQuantity,
    } = useCart();

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState("All");

  const [sortBy, setSortBy] =
    useState("default");

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    const isLoggedIn =
      localStorage.getItem(
        "isLoggedIn"
      );

    if (!isLoggedIn) {

      window.location.href =
        "/login";

      return;

    }

    fetchFoods();

  }, []);

  const fetchFoods = async () => {

    try {

      const response = await fetch(
        "http://127.0.0.1:8000/foods"
      );

      const data =
        await response.json();

      setFoods(data.foods);

    } catch (error) {

      console.log(error);

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    const setupNotifications =
      async () => {

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

    setupNotifications();

  }, []);

  // DYNAMIC CATEGORIES

  const categories = [

    "All",

    ...new Set(
      foods.map(
        (food) => food.category
      )
    ),

  ];

  // FILTER + SEARCH + SORT

  const filteredFoods =
    foods

      .filter((food) => {

        const matchesSearch =
          food.name
            .toLowerCase()
            .includes(
              search.toLowerCase()
            );

        const matchesCategory =

          selectedCategory === "All"

          ||

          food.category ===
          selectedCategory;

        return (
          matchesSearch &&
          matchesCategory
        );

      })

      .sort((a, b) => {

        if (
          sortBy ===
          "lowToHigh"
        ) {

          return (
            a.price -
            b.price
          );

        }

        if (
          sortBy ===
          "highToLow"
        ) {

          return (
            b.price -
            a.price
          );

        }

        if (
          sortBy ===
          "name"
        ) {

          return a.name.localeCompare(
            b.name
          );

        }

        return 0;

      });

  if (loading) {

    return (

      <main className="min-h-screen bg-white dark:bg-black flex items-center justify-center transition-colors duration-300">

        <h1 className="text-4xl text-orange-500 font-bold">
          Loading...
        </h1>

      </main>

    );

  }

  return (
<main className="min-h-screen bg-white text-black dark:bg-black dark:text-white transition-colors duration-300">
    

      <Navbar/>

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-5 sm:px-6 sm:py-8 lg:px-10">

        {/* HERO */}

        <h1 className="text-3xl font-bold text-orange-500 sm:text-4xl lg:text-5xl">
          CampusVita
        </h1>

        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Smart Campus Food Ordering System
        </p>

        {/* SEARCH */}

        <div className="flex gap-4 overflow-x-auto pb-2 mt-6">

          <input
            type="text"
            placeholder="Search Foods..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            className="bg-white dark:bg-zinc-900
border border-gray-300 dark:border-zinc-800
text-black dark:text-white
placeholder:text-gray-500
p-4 rounded-2xl w-full outline-none
focus:border-orange-500 transition-colors"
          />

        </div>

        {/* CATEGORY FILTER */}

        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 sm:mt-6 sm:gap-4">

          {categories.map(
            (category) => (

              <button
                key={category}
                onClick={() =>
                  setSelectedCategory(
                    category
                  )
                }
                className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all ${
                  selectedCategory ===
                  category

                   ? "bg-orange-500 text-white"
: "bg-gray-100 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-800 text-black dark:text-white"
                }`}
              >

                {category}

              </button>

            )
          )}

        </div>

        {/* SORT */}

        <div className="mt-6">

          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(
                e.target.value
              )
            }
            className="bg-white dark:bg-zinc-900
border border-gray-300 dark:border-zinc-700
text-black dark:text-white
p-3 rounded-xl outline-none"
          >

            <option value="default">
              Sort Foods
            </option>

            <option value="lowToHigh">
              Price: Low To High
            </option>

            <option value="highToLow">
              Price: High To Low
            </option>

            <option value="name">
              Name: A-Z
            </option>

          </select>

        </div>

        {/* FOOD GRID */}

        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
  {filteredFoods.map((food, index) => {
    const cartItem = cartItems.find(
      (item) => item.name === food.name
    );

    const quantity = cartItem?.quantity ?? 0;

    return (
      <FoodCard
        key={`${food.name}-${index}`}
        name={food.name}
        price={food.price}
        image={food.image}
        quantity={quantity}
        onAddToCart={() => addToCart(food)}
        onIncrease={() => increaseQuantity(food.name)}
        onDecrease={() => decreaseQuantity(food.name)}
      />
    );
  })}
</div>

        {/* EMPTY STATE */}

        {filteredFoods.length === 0 && (

          <div className="text-center mt-20">

<h2 className="text-3xl font-bold text-gray-500 dark:text-gray-400">

              No Foods Found 🍔

            </h2>

          </div>

        )}

      </div>

    </main>

  );

}