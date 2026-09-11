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

  async function loadRevenue() {
    try {
      setError(false);

      const year = new Date().getFullYear();
      const data = await getRevenueChartData(year);

      if (!data || !Array.isArray(data.revenue)) {
        throw new Error("Invalid revenue data");
      }

      setRevenueData(
        data.revenue.map((item: RevenueItem) => ({
          month: String(item.month),
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
  }

  useEffect(() => {
    loadRevenue();

    const interval = setInterval(loadRevenue, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ChartCard
      title="Revenue Overview"
      subtitle="Monthly revenue performance"
    >
      {loading && (
        <div className="flex h-[300px] w-full items-center justify-center text-sm text-zinc-400">
          Loading revenue data...
        </div>
      )}

      {!loading && error && (
        <div className="flex h-[300px] w-full items-center justify-center text-sm text-red-400">
          Failed to load revenue data.
        </div>
      )}

      {!loading && !error && revenueData.length === 0 && (
        <div className="flex h-[300px] w-full items-center justify-center text-sm text-zinc-400">
          No revenue data
        </div>
      )}

      {!loading && !error && revenueData.length > 0 && (
        <div className="h-[300px] w-full min-w-0">
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={1}
            minHeight={1}
          >
            <LineChart
              data={revenueData}
              margin={{
                top: 10,
                right: 20,
                left: 10,
                bottom: 10,
              }}
            >
              <CartesianGrid
                stroke="#27272a"
                vertical={false}
              />

              <XAxis
                dataKey="month"
                stroke="#71717a"
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                stroke="#71717a"
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                tickFormatter={(value) =>
                  `₹${Number(value).toLocaleString("en-IN")}`
                }
              />

              <Tooltip
                cursor={{ stroke: "#3f3f46" }}
                contentStyle={{
                  background: "#18181b",
                  border: "1px solid #27272a",
                  borderRadius: 14,
                  color: "#fff",
                }}
                labelStyle={{
                  color: "#fff",
                }}
                formatter={(value) => [
                  `₹${Number(value).toLocaleString("en-IN")}`,
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
                  fill: "#FF6B35",
                  strokeWidth: 0,
                }}
                activeDot={{
                  r: 7,
                  fill: "#FF6B35",
                  strokeWidth: 0,
                }}
                isAnimationActive={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}