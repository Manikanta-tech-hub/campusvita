"use client";

import OrdersChart from "./OrdersChart";
import SalesPieChart from "./SalesPieChart";

export default function AnalyticsGrid() {
  return (
    <section className="mt-8">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
        <div className="xl:col-span-2 h-full">
          <OrdersChart />
        </div>

        <div className="h-full">
          <SalesPieChart />
        </div>
      </div>
    </section>
  );
}