"use client";

import {
  Coffee,
  Cookie,
  CupSoda,
  Flame,
  IceCreamCone,
  Leaf,
  Pizza,
  Salad,
  Sandwich,
  Soup,
  Utensils,
  UtensilsCrossed,
} from "lucide-react";

/* =========================================================
   STALL CATEGORY SELECTOR
   Horizontal scrollable category pills built from real
   food `category` values returned by the menu API. Icons
   are decorative only — categories never come from a
   hard-coded list.
========================================================= */

const CATEGORY_ICONS: { keywords: string[]; icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }> }[] = [
  { keywords: ["beverage", "drink", "juice", "shake", "tea", "coffee", "milk"], icon: CupSoda },
  { keywords: ["coffee", "latte", "espresso"], icon: Coffee },
  { keywords: ["dessert", "sweet", "cake", "pastry", "bakery"], icon: CakeOrCookie },
  { keywords: ["ice cream", "icecream", "gelato", "frozen"], icon: IceCreamCone },
  { keywords: ["pizza", "italian"], icon: Pizza },
  { keywords: ["salad", "healthy", "bowl"], icon: Salad },
  { keywords: ["sandwich", "burger", "wrap", "sub"], icon: Sandwich },
  { keywords: ["soup", "ramen", "noodle"], icon: Soup },
  { keywords: ["veg", "vegetarian", "green"], icon: Leaf },
  { keywords: ["grill", "bbq", "tandoor", "kebab", "spicy"], icon: Flame },
  { keywords: ["main", "meal", "thali", "rice", "curry"], icon: UtensilsCrossed },
];

function CakeOrCookie(props: { size?: number; strokeWidth?: number; className?: string }) {
  return <Cookie {...props} />;
}

function iconForCategory(category: string) {
  const lower = category.toLowerCase();

  for (const entry of CATEGORY_ICONS) {
    if (entry.keywords.some((keyword) => lower.includes(keyword))) {
      return entry.icon;
    }
  }

  return Utensils;
}

/* ---------------------------------------------------------
   PRIMARY PILL LIST (homepage + /stalls toolbar)
--------------------------------------------------------- */

export function CategoryPills({
  categories,
  active,
  onChange,
  allLabel = "All",
  className,
}: {
  categories: string[];
  active: string | null;
  onChange: (category: string | null) => void;
  /** Label for the "no category" reset pill. */
  allLabel?: string;
  className?: string;
}) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <div
      role="group"
      aria-label="Filter by food category"
      className={`hide-scrollbar -mx-1 flex max-w-full snap-x snap-mandatory items-center gap-2 overflow-x-auto px-1 py-1 ${
        className ?? ""
      }`}
    >
      <CategoryPill
        label={allLabel}
        active={active === null || active === "all"}
        onClick={() => onChange(null)}
      />

      {categories.map((category) => {
        const Icon = iconForCategory(category);

        return (
          <CategoryPill
            key={category}
            label={category}
            icon={<Icon size={14} strokeWidth={2} />}
            active={active === category}
            onClick={() => onChange(category)}
          />
        );
      })}
    </div>
  );
}

function CategoryPill({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon?: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex h-9 shrink-0 snap-start items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[13px] font-semibold transition-all duration-150 ease-[var(--ease-standard)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] ${
        active
          ? "border border-transparent bg-[var(--primary)] text-[var(--on-primary)] shadow-[0_2px_10px_rgba(0,0,0,0.14)]"
          : "cv-glass-subtle border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
      }`}
    >
      {icon}
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

/* ---------------------------------------------------------
   FULL SELECTOR (dedicated page hero)
--------------------------------------------------------- */

export function CategorySelector({
  categories,
  active,
  onChange,
}: {
  categories: string[];
  active: string | null;
  onChange: (category: string | null) => void;
}) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <div
      role="group"
      aria-label="Food categories"
      className="flex flex-wrap items-center gap-2"
    >
      <CategoryTile
        label="All Categories"
        active={active === null || active === "all"}
        onClick={() => onChange(null)}
      />

      {categories.map((category) => {
        const Icon = iconForCategory(category);

        return (
          <CategoryTile
            key={category}
            label={category}
            icon={<Icon size={15} strokeWidth={1.9} />}
            active={active === category}
            onClick={() => onChange(category)}
          />
        );
      })}
    </div>
  );
}

function CategoryTile({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon?: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex h-10 items-center gap-2 rounded-2xl px-4 text-[13px] font-semibold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] ${
        active
          ? "border border-transparent bg-[var(--primary)] text-[var(--on-primary)]"
          : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
      }`}
    >
      {icon}
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}
