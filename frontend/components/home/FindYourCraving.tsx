"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

type FoodCategory = {
  label: string;
  image: string;
};

const categories: FoodCategory[] = [
  {
    label: "Biryani",
    image: "/images/categories/biryani.jpg",
  },
  {
    label: "Shakes",
    image: "/images/categories/shakes.jpg",
  },
  {
    label: "Samosa",
    image: "/images/categories/samosa.jpg",
  },
  {
    label: "Chinese",
    image: "/images/categories/chinese.jpg",
  },
  {
    label: "Burgers",
    image: "/images/categories/burgers.jpg",
  },
  {
    label: "Sandwiches",
    image: "/images/categories/sandwiches.jpg",
  },
  {
    label: "Pizza",
    image: "/images/categories/pizza.jpg",
  },
  {
    label: "Fast Food",
    image: "/images/categories/fast-food.jpg",
  },
  {
    label: "South Indian",
    image: "/images/categories/south-indian.jpg",
  },
  {
    label: "Momos",
    image: "/images/categories/momos.jpg",
  },
  {
    label: "Desserts",
    image: "/images/categories/desserts.jpg",
  },
  {
    label: "Tea & Coffee",
    image: "/images/categories/tea-coffee.jpg",
  },
];

export default function FindYourCraving() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  const chooseCategory = (label: string) => {
    router.push(`/stalls?category=${encodeURIComponent(label)}`);
  };

  const scrollCategories = (direction: "left" | "right") => {
    if (!scrollRef.current) return;

    scrollRef.current.scrollBy({
      left: direction === "right" ? 360 : -360,
      behavior: "smooth",
    });
  };

  return (
    <section className="mb-12 w-full">
      {/* Section heading */}
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-[clamp(1.6rem,3.2vw,2.3rem)] font-bold leading-tight tracking-[-0.035em] text-[var(--text-primary)]">
            What are you craving?
          </h2>

          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
            Find something delicious for your next campus break.
          </p>
        </div>

        {/* Desktop carousel controls */}
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <button
            type="button"
            onClick={() => scrollCategories("left")}
            aria-label="Scroll categories left"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
          >
            <ArrowLeft size={18} />
          </button>

          <button
            type="button"
            onClick={() => scrollCategories("right")}
            aria-label="Scroll categories right"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* Horizontally scrollable food categories */}
<div
  ref={scrollRef}
  style={{
    scrollbarWidth: "none",
    msOverflowStyle: "none",
  }}
  className="flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain pb-3 [&::-webkit-scrollbar]:hidden [&::-webkit-scrollbar-thumb]:hidden [&::-webkit-scrollbar-track]:hidden sm:gap-8 md:gap-10"
>

        {categories.map((category) => {
          return (
            <button
              key={category.label}
              type="button"
              onClick={() => chooseCategory(category.label)}
              
            className="group flex w-[108px] shrink-0 snap-start flex-col items-center gap-3 rounded-xl text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--background)] sm:w-[128px] md:w-[144px]"


            >
              {/* Circular image */}
              <div
                className={`relative aspect-square w-full overflow-hidden rounded-full bg-[var(--surface-secondary)] transition-all duration-300 ease-out ${
                  "group-hover:ring-2 group-hover:ring-[var(--border-strong)] group-hover:ring-offset-2 group-hover:ring-offset-[var(--background)]"
                }`}
              >
                <img
                  src={category.image}
                  alt={category.label}
                  loading="lazy"
                  draggable={false}
                  onError={(event) => {
                    event.currentTarget.style.opacity = "0";
                  }}
                  className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                />
              </div>

              {/* Category name */}
              <span
                className={`text-[13px] font-semibold leading-snug transition-colors duration-200 sm:text-sm ${
                  "text-[var(--text-primary)] group-hover:text-[var(--brand)]"
                }`}
              >
                {category.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Results summary */}
      <div className="mt-5 flex items-center justify-between gap-4 border-t border-[var(--border)] pt-4">
        <div className="min-w-0">
          <p className="text-sm text-[var(--text-secondary)]">
            Explore food around your campus
          </p>

        </div>

        <a
          href="/stalls"
          className="inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-[var(--brand)] transition-colors hover:bg-[var(--surface-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
        >
          Browse stalls
          <ArrowRight size={16} />
        </a>
      </div>
    </section>
  );
}
