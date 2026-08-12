"use client";

import { Search } from "lucide-react";

interface Props {
  search: string;
  setSearch: (value: string) => void;
  filter: string;
  setFilter: (value: string) => void;
}

const filters = [
  "All",
  "Preparing",
  "Processing",
  "Completed",
  "Cancelled",
];

export default function OrdersToolbar({
  search,
  setSearch,
  filter,
  setFilter,
}: Props) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

      {/* Search */}

      <div className="relative w-full max-w-md">

        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
        />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search orders..."
          className="
            w-full
            rounded-2xl
            border
            border-zinc-800
            bg-[#17171f]
            py-3
            pl-11
            pr-4
            text-white
            outline-none
            transition
            focus:border-orange-500
          "
        />
      </div>

      {/* Filters */}

      <div className="flex flex-wrap gap-3">

        {filters.map((item) => (

          <button
            key={item}
            onClick={() => setFilter(item)}
            className={`
              rounded-full
              px-4
              py-2
              text-sm
              font-medium
              transition-all

              ${
                filter === item
                  ? "bg-orange-500 text-white"
                  : "border border-zinc-800 bg-[#17171f] text-zinc-400 hover:border-orange-500 hover:text-white"
              }
            `}
          >
            {item}
          </button>

        ))}

      </div>

    </div>
  );
}