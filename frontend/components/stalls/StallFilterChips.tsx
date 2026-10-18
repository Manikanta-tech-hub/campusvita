"use client";

/* =========================================================
   STALL FILTER CHIPS
   Primary discovery filters. Selected chips use a
   near-black pill; inactive chips use neutral frosted
   styling. Orange is deliberately NOT used for selection.

   Chips are combinable (multi-select); "All Stalls" clears
   the rest. Filters the current dataset cannot support are
   rendered disabled with an explanation — never decorative.
========================================================= */

export type PrimaryChipId =
  | "all"
  | "open"
  | "quick"
  | "veg"
  | "nonveg"
  | "top";

export type ChipDefinition = {
  id: PrimaryChipId;
  label: string;
  enabled: boolean;
  disabledReason?: string;
};

export default function StallFilterChips({
  chips,
  selected,
  onChange,
  className,
}: {
  chips: ChipDefinition[];
  /** Currently active chips (more than one may be active). */
  selected: PrimaryChipId[];
  onChange: (id: PrimaryChipId) => void;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label="Filter stalls"
      className={`hide-scrollbar -mx-1 flex max-w-full snap-x snap-mandatory items-center gap-2 overflow-x-auto px-1 py-1 ${
        className ?? ""
      }`}
    >
      {chips.map((chip) => {
        const isSelected = selected.includes(chip.id);
        const disabled = !chip.enabled;

        return (
          <button
            key={chip.id}
            type="button"
            disabled={disabled}
            aria-pressed={isSelected}
            title={disabled ? chip.disabledReason : undefined}
            onClick={() => onChange(chip.id)}
            className={`inline-flex h-9 shrink-0 snap-start items-center whitespace-nowrap rounded-full px-4 text-[13px] font-semibold transition-all duration-150 ease-[var(--ease-standard)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] ${
              disabled
                ? "cursor-not-allowed border border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--text-subtle)] opacity-60"
                : isSelected
                  ? "border border-transparent bg-[var(--primary)] text-[var(--on-primary)] shadow-[0_2px_10px_rgba(0,0,0,0.14)]"
                  : "cv-glass-subtle border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
            }`}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
