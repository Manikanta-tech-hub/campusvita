"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

/* =========================================================
   STALL SEARCH INPUT
   Controlled, debounced, accessible search field used by
   both the homepage section and the /stalls page.
========================================================= */

export default function StallSearchInput({
  value,
  onChange,
  placeholder = "Search stalls, dishes, or cuisines...",
  label = "Search stalls, dishes, or cuisines",
  autoFocus = false,
  large = false,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  autoFocus?: boolean;
  large?: boolean;
  className?: string;
}) {
  const [draft, setDraft] = useState(value);
  const onChangeRef = useRef(onChange);
  const skipNextSync = useRef(false);

  /* Keep the ref current without touching it during render */
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  /* Keep local draft in sync when the value is cleared externally */
  useEffect(() => {
    if (skipNextSync.current) {
      skipNextSync.current = false;
      return;
    }

    setDraft(value);
  }, [value]);

  /* Debounce external propagation (250ms) */
  useEffect(() => {
    if (draft === value) {
      return;
    }

    const timer = window.setTimeout(() => {
      skipNextSync.current = true;
      onChangeRef.current(draft);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [draft, value]);

  const clear = () => {
    setDraft("");
    skipNextSync.current = true;
    onChangeRef.current("");
  };

  return (
    <div className={`relative ${className ?? ""}`}>
      <Search
        size={large ? 22 : 20}
        strokeWidth={2.25}
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 shrink-0 text-[var(--text-secondary)]"
      />

      <input
        type="search"
        value={draft}
        autoFocus={autoFocus}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && draft) {
            event.preventDefault();
            clear();
          }
        }}
        placeholder={placeholder}
        aria-label={label}
        className={`cv-glass-subtle w-full rounded-2xl pl-11 pr-11 text-sm text-[var(--text-primary)] outline-none transition-all duration-200 placeholder:text-[var(--text-muted)] hover:border-[var(--border-strong)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft-strong)] ${
          large ? "h-14 sm:h-16 sm:pl-13 sm:text-base" : "h-12"
        }`}
      />

      {draft.length > 0 && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--primary-soft)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
