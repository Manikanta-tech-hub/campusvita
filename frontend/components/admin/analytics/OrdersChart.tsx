"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import ChartCard from "./ChartCard";
import { getOrderChartData } from "@/app/lib/api";

type BackendOrder = {
  order_id: string;
  date: string;
  status?: string;
};

type ChartOrder = {
  date: string;
  day: string;
  orders: number;
};

export default function OrdersChart() {
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadOrders() {
      try {
        const data = await getOrderChartData();

        if (!mounted) return;

        if (!data || !Array.isArray(data.orders)) {
          throw new Error("Invalid order chart data");
        }

        setOrders(data.orders);
        setError(false);
      } catch (err) {
        console.error("Failed to load order chart data:", err);

        if (mounted) {
          setOrders([]);
          setError(true);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadOrders();

    const interval = setInterval(loadOrders, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const chartData = useMemo<ChartOrder[]>(() => {
    const uniqueOrders = new Map<string, BackendOrder>();

    for (const order of orders) {
      if (!order.order_id) continue;

      if (!uniqueOrders.has(order.order_id)) {
        uniqueOrders.set(order.order_id, order);
      }
    }

    const totals = new Map<string, number>();

    for (const order of uniqueOrders.values()) {
      if (!order.date) continue;

      const date = new Date(order.date);

      if (Number.isNaN(date.getTime())) continue;

      const dateKey = date.toISOString().split("T")[0];

      totals.set(
        dateKey,
        (totals.get(dateKey) ?? 0) + 1
      );
    }

    return Array.from(totals.entries())
      .sort(([dateA], [dateB]) =>
        dateA.localeCompare(dateB)
      )
      .map(([date, count]) => {
        const dateObject = new Date(`${date}T00:00:00`);

        return {
          date,
          day: dateObject.toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
          }),
          orders: count,
        };
      });
  }, [orders]);

  return (
    <ChartCard
      title="Orders Overview"
      subtitle="Orders received from the database"
    >
      {loading && (
        <div className="flex h-[300px] w-full items-center justify-center text-sm text-zinc-400">
          Loading orders...
        </div>
      )}

      {!loading && error && (
        <div className="flex h-[300px] w-full items-center justify-center text-sm text-red-400">
          Failed to load order data.
        </div>
      )}

      {!loading && !error && chartData.length === 0 && (
        <div className="flex h-[300px] w-full items-center justify-center text-sm text-zinc-400">
          No orders found.
        </div>
      )}

      {!loading && !error && chartData.length > 0 && (
        <div className="h-[300px] w-full min-w-0">
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={1}
            minHeight={1}
          >
            <BarChart
              data={chartData}
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
                dataKey="day"
                stroke="#71717a"
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                allowDecimals={false}
                stroke="#71717a"
                tickLine={false}
                axisLine={false}
              />

              <Tooltip
                cursor={{
                  fill: "rgba(255,255,255,0.04)",
                }}
                contentStyle={{
                  background: "#18181b",
                  border: "1px solid #27272a",
                  borderRadius: 14,
                  color: "#fff",
                }}
                formatter={(value) => [
                  `${Number(value)} orders`,
                  "Orders",
                ]}
              />

              <Bar
                dataKey="orders"
                fill="#FF6B35"
                radius={[8, 8, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}