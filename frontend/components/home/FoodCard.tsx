"use client";

import { Minus, Plus } from "lucide-react";
import { getImageUrl } from "@/app/lib/getImageUrl";

type Props = {
  name: string;
  price: number;
  image: string;
  quantity: number;
  onAddToCart: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
};

export default function FoodCard({
  name,
  price,
  image,
  quantity,
  onAddToCart,
  onIncrease,
  onDecrease,
}: Props) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:border-orange-400 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      {/* FOOD IMAGE */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-zinc-800">
        <img
          src={getImageUrl(image)}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>

      {/* CONTENT */}
      <div className="flex min-h-[108px] flex-col p-3">
        <h2 className="line-clamp-2 text-sm font-semibold leading-5 text-gray-900 dark:text-white sm:text-base">
          {name}
        </h2>

        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <p className="text-base font-bold text-orange-500 sm:text-lg">
            ₹{price}
          </p>

          {/* QUANTITY CONTROL */}
          {quantity > 0 ? (
            <div
              className="flex h-9 items-center overflow-hidden rounded-xl border border-orange-500 bg-orange-500 text-white shadow-sm"
              aria-label={`${quantity} ${name} in cart`}
            >
              <button
                type="button"
                onClick={onDecrease}
                aria-label={`Decrease ${name} quantity`}
                className="flex h-full w-8 items-center justify-center transition-colors hover:bg-orange-600 active:bg-orange-700"
              >
                <Minus size={15} strokeWidth={2.5} />
              </button>

              <span className="min-w-7 text-center text-sm font-bold">
                {quantity}
              </span>

              <button
                type="button"
                onClick={onIncrease}
                aria-label={`Increase ${name} quantity`}
                className="flex h-full w-8 items-center justify-center transition-colors hover:bg-orange-600 active:bg-orange-700"
              >
                <Plus size={15} strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            /* COMPACT ADD BUTTON */
            <button
              type="button"
              onClick={onAddToCart}
              aria-label={`Add ${name} to cart`}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-orange-500 bg-orange-500 text-white shadow-sm transition-all hover:bg-orange-600 active:scale-95 active:bg-orange-700"
            >
              <Plus size={19} strokeWidth={2.75} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}