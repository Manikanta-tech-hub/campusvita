"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, ArrowUpDown } from "lucide-react";

import {
  describeSort,
  type DiscoverySort,
} from "@/app/lib/stallDiscovery";
import {
  FloatingPortal,
  useAnchoredPosition,
  useDismiss,
} from "@/components/stalls/FloatingPanel";

/* =========================================================
   STALL SORT SELECT
   Compact trigger (36px) + FLOATING glass popover portaled
   to document.body — it overlays the stall grid and can
   never push content down or get clipped by ancestors.
   Keyboard: Enter/Space open, arrows move, Escape closes.
========================================================= */

const SORT_OPTIONS: { id: DiscoverySort; label: string }[] = [
  { id: "recommended", label: "Recommended" },
  { id: "name", label: "Name A–Z" },
  { id: "open", label: "Open First" },
  { id: "pickup", label: "Quickest Pickup" },
  { id: "rating", label: "Highest Rated" },
];

export default function StallSortSelect({
  value,
  onChange,
  enabledSorts,
  className,
}: {
  value: DiscoverySort;
  onChange: (sort: DiscoverySort) => void;
  /** Sort ids supported by the currently loaded data. */
  enabledSorts: DiscoverySort[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { position, measure } = useAnchoredPosition(triggerRef, open, {
    gap: 8,
  });

  const toggleOpen = () => {
    if (!open) {
      measure();
    }
    setOpen(!open);
  };

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  };

  useDismiss(open, [triggerRef, menuRef], close);

  /* Move focus to the selected option when opened.
     preventScroll keeps the page exactly where it is. */
  useEffect(() => {
    if (!open) {
      return;
    }

    const selected = menuRef.current?.querySelector<HTMLElement>(
      '[aria-checked="true"]'
    );

    selected?.focus({ preventScroll: true });
  }, [open]);

  const moveFocus = (delta: number) => {
    const options = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ??
        []
    ).filter((option) => !option.hasAttribute("disabled"));

    if (!options.length) {
      return;
    }

    const currentIndex = options.findIndex(
      (option) => option === document.activeElement
    );

    const nextIndex =
      currentIndex === -1
        ? 0
        : (currentIndex + delta + options.length) % options.length;

    options[nextIndex].focus();
  };

  const select = (id: DiscoverySort) => {
    onChange(id);
    close();
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggleOpen}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            measure();
            setOpen(true);
          }
        }}
        className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)]/80 px-3.5 text-[13px] font-semibold text-[var(--text-primary)] backdrop-blur-md transition-colors hover:border-[var(--border-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] ${
          className ?? ""
        }`}
      >
        <ArrowUpDown size={16} aria-hidden="true" />
        <span className="hidden max-w-[9.5rem] truncate sm:inline">
          {describeSort(value)}
        </span>
        <span className="sm:hidden">Sort</span>
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && position && (
        <FloatingPortal>
          <div
            ref={menuRef}
            role="menu"
            aria-label="Sort stalls"
            style={{
              position: "fixed",
              top: position.top,
              right: position.right,
              maxHeight: position.maxHeight,
              zIndex: 60,
            }}
            className="cv-floating-popover w-56 overflow-y-auto p-1.5"
          >
            {SORT_OPTIONS.map((option) => {
              const enabled = enabledSorts.includes(option.id);
              const checked = option.id === value;

              return (
                <button
                  key={option.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={checked}
                  disabled={!enabled}
                  title={
                    enabled
                      ? undefined
                      : "Not enough data on current stalls to sort by this"
                  }
                  onClick={() => enabled && select(option.id)}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      moveFocus(1);
                    } else if (event.key === "ArrowUp") {
                      event.preventDefault();
                      moveFocus(-1);
                    }
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--primary)] ${
                    !enabled
                      ? "cursor-not-allowed text-[var(--text-subtle)]"
                      : checked
                        ? "bg-[var(--primary-soft)] font-semibold text-[var(--text-primary)]"
                        : "font-medium text-[var(--text-secondary)] hover:bg-[var(--primary-soft)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {option.label}

                  {checked && (
                    <Check size={15} aria-hidden="true" className="shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
