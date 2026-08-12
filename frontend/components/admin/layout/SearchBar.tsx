"use client";

import { Search } from "lucide-react";

export default function SearchBar() {
  return (
    <div className="relative w-full max-w-md">
      <Search
        size={18}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
      />

      <input
        type="text"
        placeholder="Search anything..."
        className="
          w-full
          rounded-2xl
          border
          border-zinc-800
          bg-zinc-900
          py-3
          pl-11
          pr-4
          text-sm
          outline-none
          transition
          focus:border-orange-500
        "
      />
    </div>
  );
}