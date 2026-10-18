import { Skeleton } from "@/components/ui/glass";

/* =========================================================
   STALL CARD SKELETON
   Mirrors StallCard geometry to avoid layout shift when
   real data arrives. Neutral shimmer only — no orange.
========================================================= */

export function StallCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)]"
    >
      {/* Image placeholder */}
      <Skeleton className="aspect-[3/2] w-full rounded-none" />

      {/* Content placeholder */}
      <div className="space-y-3 p-5">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-2/3" />

        <div className="flex gap-2 pt-1">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-3 w-16" />
        </div>

        <Skeleton className="mt-2 h-9 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function StallGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-label="Loading campus stalls"
      aria-busy="true"
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
    >
      {Array.from({ length: count }).map((_, index) => (
        <StallCardSkeleton key={index} />
      ))}
    </div>
  );
}
