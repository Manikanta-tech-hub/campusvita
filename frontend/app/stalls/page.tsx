import { Suspense } from "react";

import StallsPageClient from "./StallsPageClient";
import { StallGridSkeleton } from "@/components/stalls/StallCardSkeleton";

/* =========================================================
   ALL CAMPUS STALLS — dedicated discovery page (server shell)

   Server component owns metadata; the interactive page is a
   client component wrapped in Suspense because it reads
   URL search params (Next 16 requirement).
========================================================= */

export const metadata = {
  title: "All Campus Stalls | CampusVita",
  description:
    "Browse every food stall on campus — search by dish or stall, filter by open status, veg options, pickup time and price, and jump straight to any menu.",
};

export default function StallsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-32 sm:px-6 lg:px-8">
          <div className="mb-8 h-10 w-64 rounded-xl bg-[var(--surface-secondary)]" />
          <StallGridSkeleton count={6} />
        </div>
      }
    >
      <StallsPageClient />
    </Suspense>
  );
}
