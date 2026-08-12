"use client";

import { Search } from "lucide-react";

type Props = {
  search: string;
  category: string;
  status: string;
  sort: string;

  categories: string[];

  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSortChange: (value: string) => void;
};

export default function FoodFilters({
  search,
  category,
  status,
  sort,
  categories,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  onSortChange,
}: Props) {
  return (
    <div
      className="
      bg-zinc-900
      border
      border-zinc-800
      rounded-2xl
      p-5
      mb-8
      "
    >
      <div
        className="
        grid
        grid-cols-1
        md:grid-cols-2
        xl:grid-cols-4
        gap-4
        "
      >
        {/* Search */}

        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
          />

          <input
            value={search}
            onChange={(e) =>
              onSearchChange(e.target.value)
            }
            placeholder="Search by food name..."
            className="
              w-full
              bg-zinc-800
              border
              border-zinc-700
              rounded-xl
              py-3
              pl-11
              pr-4
              text-white
              placeholder:text-zinc-500
              outline-none
              focus:border-orange-500
            "
          />
        </div>

        {/* Category */}

        <select
          value={category}
          onChange={(e) =>
            onCategoryChange(e.target.value)
          }
          className="
            bg-zinc-800
            border
            border-zinc-700
            rounded-xl
            py-3
            px-4
            text-white
            outline-none
            focus:border-orange-500
          "
        >
          <option value="ALL">All Categories</option>

          {categories.map((cat) => (
            <option
              key={cat}
              value={cat}
            >
              {cat}
            </option>
          ))}
        </select>

        {/* Status */}

        <select
          value={status}
          onChange={(e) =>
            onStatusChange(e.target.value)
          }
          className="
            bg-zinc-800
            border
            border-zinc-700
            rounded-xl
            py-3
            px-4
            text-white
            outline-none
            focus:border-orange-500
          "
        >
          <option value="ALL">
            All Status
          </option>

          <option value="AVAILABLE">
            Available
          </option>

          <option value="UNAVAILABLE">
            Out of Stock
          </option>
        </select>

        {/* Sort */}

        <select
          value={sort}
          onChange={(e) =>
            onSortChange(e.target.value)
          }
          className="
            bg-zinc-800
            border
            border-zinc-700
            rounded-xl
            py-3
            px-4
            text-white
            outline-none
            focus:border-orange-500
          "
        >
          <option value="LATEST">
            Latest
          </option>

          <option value="NAME_ASC">
            Name A-Z
          </option>

          <option value="NAME_DESC">
            Name Z-A
          </option>

          <option value="PRICE_LOW">
            Price Low → High
          </option>

          <option value="PRICE_HIGH">
            Price High → Low
          </option>
        </select>
      </div>
    </div>
  );
}