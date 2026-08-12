"use client";

import KPICardSkeleton from "./KPICardSkeleton";
import ChartSkeleton from "./ChartSkeleton";
import TableSkeleton from "./TableSkeleton";

export default function DashboardSkeleton() {
  return (
    <div className="space-y-8">

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        {[...Array(4)].map((_, i) => (
          <KPICardSkeleton key={i} />
        ))}

      </div>

      <div className="grid grid-cols-12 gap-6">

        <div className="col-span-12 xl:col-span-8">
          <ChartSkeleton />
        </div>

        <div className="col-span-12 xl:col-span-4">
          <ChartSkeleton />
        </div>

      </div>

      <TableSkeleton />

    </div>
  );
}