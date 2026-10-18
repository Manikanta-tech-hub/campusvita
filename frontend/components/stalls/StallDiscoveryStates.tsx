"use client";

import {
  AlertCircle,
  SearchX,
  Store,
  UtensilsCrossed,
} from "lucide-react";

import { GlassButton, EmptyState } from "@/components/ui/glass";

/* =========================================================
   DISCOVERY STATES
   Distinct empty and error states for stall discovery.
   An empty API response is never presented as a failure.
========================================================= */

type EmptyKind =
  | "no-stalls"
  | "no-filter-matches"
  | "no-search-results"
  | "none-open";

export function StallEmptyState({
  kind,
  query,
  onClear,
}: {
  kind: EmptyKind;
  query?: string;
  onClear?: () => void;
}) {
  if (kind === "no-stalls") {
    return (
      <EmptyState
        icon={<Store size={26} strokeWidth={1.6} />}
        title="No stalls on campus yet"
        description="Food stalls will appear here as soon as they start serving on CampusVita."
      />
    );
  }

  if (kind === "no-search-results") {
    return (
      <EmptyState
        icon={<SearchX size={26} strokeWidth={1.6} />}
        title="No results found"
        description={
          query
            ? `Nothing matched “${query}”. Try a different dish, cuisine, or stall name.`
            : "Try a different dish, cuisine, or stall name."
        }
        action={
          onClear && (
            <GlassButton variant="secondary" size="sm" onClick={onClear}>
              Clear search
            </GlassButton>
          )
        }
      />
    );
  }

  if (kind === "none-open") {
    return (
      <EmptyState
        icon={<Store size={26} strokeWidth={1.6} />}
        title="No stalls are open right now"
        description="Nothing is accepting orders at the moment. Clear the filter to browse every stall."
        action={
          onClear && (
            <GlassButton variant="secondary" size="sm" onClick={onClear}>
              Show all stalls
            </GlassButton>
          )
        }
      />
    );
  }

  return (
    <EmptyState
      icon={<UtensilsCrossed size={26} strokeWidth={1.6} />}
      title="No stalls match your filters"
      description="Try clearing a filter or exploring all stalls."
      action={
        onClear && (
          <GlassButton variant="secondary" size="sm" onClick={onClear}>
            Clear Filters
          </GlassButton>
        )
      }
    />
  );
}

export function StallDiscoveryError({
  onRetry,
  message = "We couldn't load the campus stalls right now.",
}: {
  onRetry?: () => void;
  message?: string;
}) {
  return (
    <div
      role="alert"
      className="rounded-3xl border border-[color-mix(in_srgb,var(--danger)_20%,transparent)] bg-[var(--danger-soft)] p-6 sm:p-8"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface)]">
            <AlertCircle
              size={19}
              className="text-[var(--danger)]"
              aria-hidden="true"
            />
          </span>

          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Something went wrong
            </h3>

            <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)] sm:text-sm">
              {message} Check your connection and try again.
            </p>
          </div>
        </div>

        {onRetry && (
          <GlassButton
            variant="secondary"
            size="sm"
            onClick={onRetry}
            className="shrink-0"
          >
            Retry
          </GlassButton>
        )}
      </div>
    </div>
  );
}
