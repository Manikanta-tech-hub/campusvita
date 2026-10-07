"use client";

import { Search } from "lucide-react";

export default function SearchBar() {
  return (
    <div className="relative w-full max-w-md">
      <Search
        size={18}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
      />

      <input
        type="text"
        placeholder="Search anything..."
        className="
          w-full
          rounded-2xl
          border
          border-input-border
          bg-input
          py-3
          pl-11
          pr-4
          text-sm
          text-text-primary
          placeholder:text-text-muted
          outline-none
          transition-all
          duration-200
          focus:border-brand
          focus:ring-2
          focus:ring-brand/10
        "
      />
    </div>
  );
}