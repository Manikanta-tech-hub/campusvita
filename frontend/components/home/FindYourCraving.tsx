"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

type Stall = {
  _id: string;
  name: string;
  description?: string;
  image: string;
  is_open: boolean;
  active: boolean;
};

type FoodCategory = {
  label: string;
  image: string;
  keywords: string[];
};

const categories: FoodCategory[] = [
  {
    label: "Biryani",
    image: "/images/categories/biryani.jpg",
    keywords: ["biryani", "dum biryani", "pulao"],
  },
  {
    label: "Shakes",
    image: "/images/categories/shakes.jpg",
    keywords: ["shake", "shakes", "smoothie", "milkshake"],
  },
  {
    label: "Samosa",
    image: "/images/categories/samosa.jpg",
    keywords: ["samosa", "samosas"],
  },
  {
    label: "Chinese",
    image: "/images/categories/chinese.jpg",
    keywords: ["chinese", "noodles", "fried rice", "manchurian", "momos"],
  },
  {
    label: "Burgers",
    image: "/images/categories/burgers.jpg",
    keywords: ["burger", "burgers"],
  },
  {
    label: "Sandwiches",
    image: "/images/categories/sandwiches.jpg",
    keywords: ["sandwich", "sandwiches", "sub"],
  },
  {
    label: "Pizza",
    image: "/images/categories/pizza.jpg",
    keywords: ["pizza", "pizzas"],
  },
  {
    label: "Fast Food",
    image: "/images/categories/fast-food.jpg",
    keywords: ["fast food", "fries", "french fries", "wrap", "rolls", "fried chicken"],
  },
  {
    label: "South Indian",
    image: "/images/categories/south-indian.jpg",
    keywords: ["dosa", "idli", "uttapam", "vada", "south indian"],
  },
  {
    label: "Momos",
    image: "/images/categories/momos.jpg",
    keywords: ["momo", "momos", "dumpling", "dumplings"],
  },
  {
    label: "Desserts",
    image: "/images/categories/desserts.jpg",
    keywords: ["dessert", "desserts", "cake", "brownie", "ice cream", "pastry"],
  },
  {
    label: "Tea & Coffee",
    image: "/images/categories/tea-coffee.jpg",
    keywords: ["tea", "coffee", "chai", "cappuccino", "latte"],
  },
];

function matchesCategory(stall: Stall, category: FoodCategory) {
  const text = `${stall.name} ${stall.description ?? ""}`.toLowerCase();

  return category.keywords.some((keyword) => {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`, "i").test(text);
  });
}

export default function FindYourCraving({
  stalls,
}: {
  stalls: Stall[];
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (!picked) return stalls;

    const category = categories.find((item) => item.label === picked);

    return category
      ? stalls.filter((stall) => matchesCategory(stall, category))
      : stalls;
  }, [picked, stalls]);

  const toggleCategory = (label: string) => {
    setPicked((current) => (current === label ? null : label));
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
          <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-black leading-tight tracking-[-0.045em] text-[var(--text-primary)]">
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
          const active = picked === category.label;

          return (
            <button
              key={category.label}
              type="button"
              onClick={() => toggleCategory(category.label)}
              aria-pressed={active}
              
            className="group flex w-[108px] shrink-0 snap-start flex-col items-center gap-3 rounded-xl text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--background)] sm:w-[128px] md:w-[144px]"


            >
              {/* Circular image */}
              <div
                className={`relative aspect-square w-full overflow-hidden rounded-full bg-[var(--surface-secondary)] transition-all duration-300 ease-out ${
                  active
                    ? "ring-[3px] ring-[var(--brand)] ring-offset-4 ring-offset-[var(--background)]"
                    : "group-hover:ring-2 group-hover:ring-[var(--border-strong)] group-hover:ring-offset-2 group-hover:ring-offset-[var(--background)]"
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
                  active
                    ? "text-[var(--brand)]"
                    : "text-[var(--text-primary)] group-hover:text-[var(--brand)]"
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
            {picked ? (
              <>
                Showing{" "}
                <span className="font-semibold text-[var(--text-primary)]">
                  {results.length}
                </span>{" "}
                {results.length === 1 ? "matching stall" : "matching stalls"}
              </>
            ) : (
              "Explore food around your campus"
            )}
          </p>

          {picked && (
            <button
              type="button"
              onClick={() => setPicked(null)}
              className="mt-1 text-xs font-medium text-[var(--brand)] hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>

        <a
          href="#stalls"
          className="inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-[var(--brand)] transition-colors hover:bg-[var(--surface-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
        >
          Browse stalls
          <ArrowRight size={16} />
        </a>
      </div>
    </section>
  );
}