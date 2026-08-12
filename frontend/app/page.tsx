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

      <div className="flex-1 p-10 max-w-7xl mx-auto">

        {/* HERO */}

        <h1 className="text-5xl font-bold text-orange-500">
          CampusVita
        </h1>

        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Smart Campus Food Ordering System
        </p>

        {/* SEARCH */}

        <div className="mt-8">

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

        <div className="flex gap-4 overflow-x-auto pb-2 mt-6">

          {categories.map(
            (category) => (

              <button
                key={category}
                onClick={() =>
                  setSelectedCategory(
                    category
                  )
                }
                className={`px-6 py-3 rounded-2xl whitespace-nowrap transition-all ${
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">

          {filteredFoods.map(
            (food, index) => (

              <FoodCard
                key={index}
                name={food.name}
                price={food.price}
                image={food.image}
                onAddToCart={() =>
                  addToCart(food)
                }
              />

            )
          )}

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