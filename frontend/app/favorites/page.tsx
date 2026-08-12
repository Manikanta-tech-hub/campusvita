"use client";

import { useEffect, useState } from "react";
import { getImageUrl } from "@/app/lib/getImageUrl";
import Navbar from "@/components/layout/Navbar";

import { useCart } from "../../context/CartContext";

type FavoriteFood = {
  name: string;
  price: number;
  image: string;
};

export default function FavoritesPage() {

  const [favorites, setFavorites] =
    useState<FavoriteFood[]>([]);

  const {
    cartItems,
    addToCart,
  } = useCart();

  useEffect(() => {

    const savedFavorites =
      JSON.parse(
        localStorage.getItem(
          "favorites"
        ) || "[]"
      );

    setFavorites(savedFavorites);

  }, []);

  const removeFavorite = (
    name: string
  ) => {

    const updated =
      favorites.filter(
        (item) =>
          item.name !== name
      );

    setFavorites(updated);

    localStorage.setItem(
      "favorites",
      JSON.stringify(updated)
    );

  };

  return (

    <>
      <Navbar/>

      <main className="min-h-screen bg-black text-white p-10">

        <h1 className="text-5xl font-bold text-orange-500">

          Favorites ❤️

        </h1>

        {favorites.length === 0 ? (

          <div className="mt-20 text-center">

            <h2 className="text-3xl text-gray-400">

              No Favorites Yet

            </h2>

          </div>

        ) : (

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">

            {favorites.map(
              (food, index) => (

                <div
                  key={index}
                  className="bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800"
                >

                  <img
                    src={getImageUrl(food.image)}
                    alt={food.name}
                    className="w-full h-34 object-cover"
                  />

                  <div className="p-6">

                    <h2 className="text-3xl font-bold">
                      {food.name}
                    </h2>

                    <p className="text-orange-500 text-2xl mt-2">
                      ₹{food.price}
                    </p>

                    <div className="flex gap-4 mt-6">

                      <button
                        onClick={() =>
                          addToCart(food)
                        }
                        className="bg-orange-500 px-6 py-3 rounded-2xl hover:bg-orange-600 transition-all"
                      >

                        Add To Cart

                      </button>

                      <button
                        onClick={() =>
                          removeFavorite(
                            food.name
                          )
                        }
                        className="bg-red-500 px-6 py-3 rounded-2xl hover:bg-red-600 transition-all"
                      >

                        Remove

                      </button>

                    </div>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </main>

    </>

  );

}