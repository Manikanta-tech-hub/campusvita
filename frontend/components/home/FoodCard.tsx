"use client";

import { ShoppingCart } from "lucide-react";
import { getImageUrl } from "@/app/lib/getImageUrl";

type Props = {
  name: string;
  price: number;
  image: string;
  onAddToCart: () => void;
};

export default function FoodCard({
  name,
  price,
  image,
  onAddToCart,
}: Props) {

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border border-gray-300 dark:border-zinc-800 hover:border-orange-500 shadow-md hover:shadow-xl transition-all duration-300">

      <div className="relative">
        <img
          src={getImageUrl(image)}
          alt={name}
          className="w-full h-56 object-cover"
        />

      </div>

      <div className="p-6">
        <h2 className="text-2xl font-bold text-black dark:text-white">
          {name}
        </h2>

        <p className="text-orange-500 text-xl mt-2">
          ₹{price}
        </p>

        <button
          onClick={onAddToCart}
          className="bg-orange-500 hover:bg-orange-600 text-white transition-all px-5 py-3 rounded-2xl flex items-center gap-3 mt-6"
        >
          <ShoppingCart size={22} />
          Add To Cart
        </button>
      </div>
    </div>
  );
}