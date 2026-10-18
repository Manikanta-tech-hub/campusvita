"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, SlidersHorizontal, X } from "lucide-react";

import {
  countActiveFilters,
  type DiscoveryFilters,
} from "@/app/lib/stallDiscovery";
import {
  FloatingPortal,
  useAnchoredPosition,
  useDismiss,
  useMediaQuery,
} from "@/components/stalls/FloatingPanel";

/* =========================================================
   ADVANCED FILTER DRAWER
   Trigger stays in the search row; the PANEL is portaled to
   document.body as a fixed-position floating popover — it
   overlays page content and can never be clipped, squeezed
   by flex parents, or push the stall grid down.

   Desktop: anchored popover (380px) below the trigger.
   Mobile:  bottom sheet with backdrop + scroll lock.

   Immediate-apply model — every change is live, so there is
   no Apply button and no stale-state trap.
========================================================= */

type Option<T> = { value: T; label: string; hint?: string };

const PREP_OPTIONS: Option<number | null>[] = [
  { value: null, label: "Any pickup time" },
  { value: 10, label: "10 min or less" },
  { value: 20, label: "20 min or less" },
  { value: 30, label: "30 min or less" },
];

const RATING_OPTIONS: Option<number | null>[] = [
  { value: null, label: "Any rating" },
  { value: 3, label: "3.0 and up" },
  { value: 4, label: "4.0 and up" },
  { value: 4.5, label: "4.5 and up" },
];

const PRICE_OPTIONS: Option<DiscoveryFilters["priceBand"]>[] = [
  { value: "any", label: "Any price" },
  { value: "budget", label: "Budget", hint: "Under ₹50" },
  { value: "mid", label: "Mid-range", hint: "₹51–₹120" },
  { value: "premium", label: "Premium", hint: "₹120+" },
];

const DESKTOP_QUERY = "(min-width: 1024px)";

export default function StallFilterDrawer({
  filters,
  onChange,
  categories,
  capabilities,
  variant = "pill",
}: {
  filters: DiscoveryFilters;
  onChange: (next: DiscoveryFilters) => void;
  categories: string[];
  capabilities: {
    anyRating: boolean;
    anyPrepTime: boolean;
    anyVegData: boolean;
    anyPrice: boolean;
  };
  /**
   * pill  — labeled pill trigger (toolbar rows)
   * icon  — square glass icon trigger (search rows)
   */
  variant?: "pill" | "icon";
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const { position, measure } = useAnchoredPosition(triggerRef, open, {
    gap: 12,
  });

  const activeCount = countActiveFilters(filters);

  const toggleOpen = () => {
    if (!open) {
      measure();
    }
    setOpen(!open);
  };

  /* Close on outside click / Escape (portal-aware) */
  useDismiss(open, [triggerRef, panelRef], () => {
    setOpen(false);
  });

  /* Lock page scroll for the mobile bottom sheet only.
     Compensate for the disappearing scrollbar so locking
     never shifts the page horizontally. */
  useEffect(() => {
    if (!open || isDesktop) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousPadding = document.body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadding;
    };
  }, [open, isDesktop]);

  const patch = (partial: Partial<DiscoveryFilters>) => {
    onChange({ ...filters, ...partial });
  };

  const clearAll = () => {
    onChange({
      ...filters,
      openNow: false,
      quickPickup: false,
      vegetarian: false,
      nonVeg: false,
      topRated: false,
      category: null,
      maxPrepMinutes: null,
      minRating: null,
      priceBand: "any",
    });
  };

  return (
    <>
      {/* --------------------------------------------------
          TRIGGER
      -------------------------------------------------- */}

      {variant === "icon" ? (
        <button
          ref={triggerRef}
          type="button"
          aria-label="Advanced filters"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={toggleOpen}
          className={`relative inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] ${
            open || activeCount > 0
              ? "border-transparent bg-[var(--primary)] text-[var(--on-primary)]"
              : "cv-glass-subtle border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--border-strong)]"
          }`}
        >
          <SlidersHorizontal size={20} aria-hidden="true" />

          {activeCount > 0 && (
            <span
              className="cv-tnum absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-bold text-[var(--on-accent)] shadow-sm"
              aria-hidden="true"
            >
              {activeCount}
            </span>
          )}
        </button>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={toggleOpen}
          className={`relative inline-flex h-9 items-center gap-2 rounded-full border px-4 text-[13px] font-semibold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] ${
            open || activeCount > 0
              ? "border-transparent bg-[var(--primary)] text-[var(--on-primary)]"
              : "cv-glass-subtle border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--border-strong)]"
          }`}
        >
          <SlidersHorizontal size={14} aria-hidden="true" />
          <span className="hidden sm:inline">Filters</span>

          {activeCount > 0 && (
            <span
              className="cv-tnum inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1.5 text-[11px] font-bold text-[var(--on-accent)]"
              aria-label={`${activeCount} filters active`}
            >
              {activeCount}
            </span>
          )}
        </button>
      )}

      {/* --------------------------------------------------
          PANEL (portaled — overlays page content)
      -------------------------------------------------- */}

      {open && (
        <FloatingPortal>
          {/* Backdrop — mobile sheet only */}
          {!isDesktop && (
            <div
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
              aria-hidden="true"
              onClick={() => setOpen(false)}
            />
          )}

          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-label="Filter stalls"
            style={
              isDesktop && position
                ? {
                    position: "fixed",
                    top: position.top,
                    right: position.right,
                    maxHeight: Math.min(position.maxHeight, 560),
                    width: 380,
                    zIndex: 60,
                  }
                : {
                    position: "fixed",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    maxHeight: "85dvh",
                    zIndex: 60,
                  }
            }
            className="cv-floating-popover overflow-y-auto p-5 pb-8"
          >
            {/* Drag handle (mobile) */}
            {!isDesktop && (
              <div
                aria-hidden="true"
                className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--border-strong)]"
              />
            )}

            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
                  Filters
                </h2>

                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                  Changes apply immediately
                </p>
              </div>

              <div className="flex items-center gap-1">
                {activeCount > 0 && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--primary-soft)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
                  >
                    Clear all
                  </button>
                )}

                <button
                  type="button"
                  aria-label="Close filters"
                  onClick={() => {
                    setOpen(false);
                    triggerRef.current?.focus({ preventScroll: true });
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--primary-soft)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Availability */}
              <FilterGroup legend="Availability">
                <ToggleRow
                  label="Open now"
                  description="Only stalls currently accepting orders"
                  checked={filters.openNow}
                  onChange={(checked) => patch({ openNow: checked })}
                />
              </FilterGroup>

              {/* Dietary — driven by real is_veg menu flags */}
              {capabilities.anyVegData && (
                <FilterGroup legend="Dietary">
                  <ToggleRow
                    label="Veg"
                    description="Stalls that serve vegetarian dishes"
                    checked={filters.vegetarian}
                    onChange={(checked) => patch({ vegetarian: checked })}
                  />
                  <ToggleRow
                    label="NonVeg"
                    description="Stalls that serve non-vegetarian dishes"
                    checked={filters.nonVeg}
                    onChange={(checked) => patch({ nonVeg: checked })}
                  />
                </FilterGroup>
              )}

              {/* Pickup time */}
              {capabilities.anyPrepTime && (
                <FilterGroup legend="Pickup time">
                  <ChoiceList
                    options={PREP_OPTIONS}
                    value={filters.maxPrepMinutes}
                    onChange={(value) => patch({ maxPrepMinutes: value })}
                  />
                </FilterGroup>
              )}

              {/* Rating */}
              {capabilities.anyRating && (
                <FilterGroup legend="Rating">
                  <ChoiceList
                    options={RATING_OPTIONS}
                    value={filters.minRating}
                    onChange={(value) => patch({ minRating: value })}
                  />
                </FilterGroup>
              )}

              {/* Price */}
              {capabilities.anyPrice && (
                <FilterGroup legend="Price range">
                  <ChoiceList
                    options={PRICE_OPTIONS}
                    value={filters.priceBand}
                    onChange={(value) => patch({ priceBand: value })}
                  />
                </FilterGroup>
              )}

              {/* Category */}
              {categories.length > 0 && (
                <FilterGroup legend="Category">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      aria-pressed={!filters.category}
                      onClick={() => patch({ category: null })}
                      className={`inline-flex h-8 items-center rounded-full px-3.5 text-[12px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[var(--primary)] ${
                        !filters.category
                          ? "bg-[var(--primary)] text-[var(--on-primary)]"
                          : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
                      }`}
                    >
                      All foods
                    </button>

                    {categories.map((category) => {
                      const active = filters.category === category;

                      return (
                        <button
                          key={category}
                          type="button"
                          aria-pressed={active}
                          onClick={() =>
                            patch({ category: active ? null : category })
                          }
                          className={`inline-flex h-8 items-center rounded-full px-3.5 text-[12px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[var(--primary)] ${
                            active
                              ? "bg-[var(--primary)] text-[var(--on-primary)]"
                              : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
                          }`}
                        >
                          {category}
                        </button>
                      );
                    })}
                  </div>
                </FilterGroup>
              )}
            </div>
          </div>
        </FloatingPortal>
      )}
    </>
  );
}

/* ---------------------------------------------------------
   SUB-COMPONENTS
--------------------------------------------------------- */

function FilterGroup({
  legend,
  children,
}: {
  legend: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
        {legend}
      </legend>

      {children}
    </fieldset>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 transition-colors hover:border-[var(--border-strong)]">
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-[var(--text-primary)]">
          {label}
        </span>

        {description && (
          <span className="mt-0.5 block text-xs text-[var(--text-muted)]">
            {description}
          </span>
        )}
      </span>

      <span className="relative shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />

        <span
          aria-hidden="true"
          className={`block h-6 w-11 rounded-full transition-colors duration-150 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--primary)] ${
            checked ? "bg-[var(--primary)]" : "bg-[var(--border-strong)]"
          }`}
        />

        <span
          aria-hidden="true"
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-150 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </span>
    </label>
  );
}

function ChoiceList<T extends string | number | null>({
  options,
  value,
  onChange,
}: {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" className="grid gap-1.5">
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={`flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-[var(--primary)] ${
              active
                ? "bg-[var(--primary-soft)] font-semibold text-[var(--text-primary)]"
                : "font-medium text-[var(--text-secondary)] hover:bg-[var(--primary-soft)] hover:text-[var(--text-primary)]"
            }`}
          >
            <span className="flex items-baseline gap-2">
              {option.label}

              {option.hint && (
                <span className="text-xs font-normal text-[var(--text-muted)]">
                  {option.hint}
                </span>
              )}
            </span>

            {active && <Check size={15} aria-hidden="true" className="shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}
