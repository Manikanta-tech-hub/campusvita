"use client";

import { useEffect, useState } from "react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import ChartCard from "./ChartCard";
import { getRevenueChartData } from "@/app/lib/api";

type RevenueItem = {
  month: string;
  revenue: number;
};

export default function RevenueChart() {
  const [revenueData, setRevenueData] = useState<RevenueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadRevenue = async () => {
    try {
      setLoading(true);
      setError(false);

      const year = new Date().getFullYear();

      const data = await getRevenueChartData(year);

      if (!data || !Array.isArray(data.revenue)) {
        throw new Error("Invalid revenue data");
      }

      setRevenueData(
        data.revenue.map((item: RevenueItem) => ({
          month: item.month,
          revenue: Number(item.revenue) || 0,
        }))
      );
    } catch (err) {
      console.error("Failed to load revenue data:", err);

      setRevenueData([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRevenue();

    // Automatically refresh every 10 seconds
    // so new/completed/cancelled orders are reflected.
    const interval = setInterval(() => {
      loadRevenue();
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="h-full">
      <ChartCard
        title="Revenue Overview"
        subtitle="Monthly revenue performance"
      >
        {/* Loading */}
        {loading && (
          <div className="flex h-[300px] w-full items-center justify-center text-sm text-zinc-400">
            Loading revenue data...
          </div>
        )}

        {/* API Error */}
        {!loading && error && (
          <div className="flex h-[300px] w-full items-center justify-center text-sm text-red-400">
            Failed to load revenue data.
          </div>
        )}

        {/* No data */}
        {!loading &&
          !error &&
          revenueData.length === 0 && (
            <div className="flex h-[300px] w-full items-center justify-center text-sm text-zinc-400">
              No revenue data
            </div>
          )}

        {/* Real revenue chart */}
        {!loading &&
          !error &&
          revenueData.length > 0 && (
            <div className="h-[300px] w-full">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <LineChart data={revenueData}>
                  <CartesianGrid
                    stroke="#27272a"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="month"
                    stroke="#71717a"
                  />

                  <YAxis
                    stroke="#71717a"
                    tickFormatter={(value) =>
                      `₹${Number(value).toLocaleString(
                        "en-IN"
                      )}`
                    }
                  />

                  <Tooltip
                    contentStyle={{
                      background: "#18181b",
                      border: "1px solid #27272a",
                      borderRadius: 14,
                    }}
                    formatter={(value) => [
                      `₹${Number(value).toLocaleString(
                        "en-IN"
                      )}`,
                      "Revenue",
                    ]}
                  />

                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#FF6B35"
                    strokeWidth={4}
                    dot={{
                      r: 5,
                    }}
                    activeDot={{
                      r: 7,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
      </ChartCard>
    </div>
  );
}