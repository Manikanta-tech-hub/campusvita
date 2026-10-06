"use client";

import { Minus, Plus, UtensilsCrossed } from "lucide-react";
import { getImageUrl } from "@/app/lib/getImageUrl";

type Props = {
  name: string;
  price: number;
  image: string;
  quantity: number;
  isVeg: boolean | null;
  onAddToCart: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
};

export default function FoodCard({
  name,
  price,
  image,
  quantity,
  isVeg,
  onAddToCart,
  onIncrease,
  onDecrease,
}: Props) {
  return (
    <article
      className="
        group
        min-w-0
        overflow-hidden
        rounded-2xl
        border
        border-[var(--border)]
        bg-[var(--surface)]
        transition-all
        duration-200
        hover:-translate-y-0.5
        hover:border-[var(--border-strong)]
        hover:shadow-[var(--shadow-soft)]
      "
    >
      {/* IMAGE */}

      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--surface-secondary)]">

        {image ? (
          <img
            src={getImageUrl(image)}
            alt={name}
            loading="lazy"
            className="
              h-full
              w-full
              object-cover
              transition-transform
              duration-500
              group-hover:scale-[1.035]
            "
            onError={(event) => {
              event.currentTarget.style.display = "none";

              const fallback =
                event.currentTarget.parentElement?.querySelector(
                  "[data-food-fallback]"
                );

              if (fallback instanceof HTMLElement) {
                fallback.classList.remove("hidden");
              }
            }}
          />
        ) : null}

        <div
          data-food-fallback
          className={`
            ${
              image ? "hidden" : "flex"
            }
            absolute
            inset-0
            items-center
            justify-center
            bg-[var(--surface-secondary)]
          `}
        >
          <UtensilsCrossed
            size={28}
            strokeWidth={1.5}
            className="text-[var(--text-muted)]"
          />
        </div>

        {/* VEG INDICATOR */}

        {isVeg !== null && (
          <div className="absolute left-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-md bg-white/95 shadow-sm dark:bg-black/85">
            <span
              className={`
                h-2.5
                w-2.5
                rounded-full
                border-2
                ${
                  isVeg
                    ? "border-green-600 bg-green-500"
                    : "border-red-600 bg-red-500"
                }
              `}
              aria-label={
                isVeg
                  ? "Vegetarian"
                  : "Non-vegetarian"
              }
            />
          </div>
        )}
      </div>

      {/* CONTENT */}

      <div className="p-3">

        <h3 className="line-clamp-2 min-h-[40px] text-sm font-bold leading-5 tracking-[-0.01em] text-[var(--text-primary)] sm:text-[15px]">
          {name}
        </h3>

        <div className="mt-3 flex items-center justify-between gap-2">

          <span className="text-[15px] font-extrabold text-[var(--text-primary)]">
            ₹{price}
          </span>

          {quantity > 0 ? (
            <div
              className="
                flex
                h-9
                items-center
                overflow-hidden
                rounded-lg
                border
                border-[var(--brand)]
                bg-[var(--brand)]
                text-white
              "
              aria-label={`${quantity} ${name} in cart`}
            >
              <button
                type="button"
                onClick={onDecrease}
                aria-label={`Decrease ${name} quantity`}
                className="
                  flex
                  h-full
                  w-8
                  items-center
                  justify-center
                  transition-colors
                  hover:bg-[var(--brand-hover)]
                  active:bg-[var(--brand-hover)]
                  focus:outline-none
                "
              >
                <Minus
                  size={14}
                  strokeWidth={2.5}
                />
              </button>

              <span className="min-w-6 text-center text-xs font-extrabold">
                {quantity}
              </span>

              <button
                type="button"
                onClick={onIncrease}
                aria-label={`Increase ${name} quantity`}
                className="
                  flex
                  h-full
                  w-8
                  items-center
                  justify-center
                  transition-colors
                  hover:bg-[var(--brand-hover)]
                  active:bg-[var(--brand-hover)]
                  focus:outline-none
                "
              >
                <Plus
                  size={14}
                  strokeWidth={2.5}
                />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onAddToCart}
              aria-label={`Add ${name} to cart`}
              className="
                flex
                h-9
                min-w-9
                items-center
                justify-center
                rounded-lg
                border
                border-[var(--brand)]
                bg-[var(--surface)]
                px-2.5
                text-[var(--brand)]
                transition-all
                hover:bg-[var(--brand)]
                hover:text-white
                active:scale-95
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-[var(--brand)]
              "
            >
              <Plus
                size={18}
                strokeWidth={2.6}
              />
            </button>
          )}

        </div>
      </div>
    </article>
  );
}