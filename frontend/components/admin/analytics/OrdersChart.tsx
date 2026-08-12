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
        setLoading(true);
        setError(false);

        const data = await getOrderChartData();

        if (!mounted) return;

        setOrders(Array.isArray(data.orders) ? data.orders : []);
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

      const dayKey = date.toISOString().split("T")[0];

      totals.set(
        dayKey,
        (totals.get(dayKey) ?? 0) + 1
      );
    }

    return Array.from(totals.entries())
      .sort(([dateA], [dateB]) =>
        dateA.localeCompare(dateB)
      )
      .map(([date, count]) => {
        const dateObject = new Date(`${date}T00:00:00`);

        return {
          day: dateObject.toLocaleDateString("en-US", {
            weekday: "short",
          }),
          orders: count,
        };
      });
  }, [orders]);

  if (loading) {
    return (
      <ChartCard
        title="Orders Overview"
        subtitle="Orders received from the database"
      >
        <div className="flex h-[300px] items-center justify-center text-sm text-zinc-400">
          Loading orders...
        </div>
      </ChartCard>
    );
  }

  if (error) {
    return (
      <ChartCard
        title="Orders Overview"
        subtitle="Orders received from the database"
      >
        <div className="flex h-[300px] items-center justify-center text-sm text-red-400">
          Failed to load order data.
        </div>
      </ChartCard>
    );
  }

  if (chartData.length === 0) {
    return (
      <ChartCard
        title="Orders Overview"
        subtitle="Orders received from the database"
      >
        <div className="flex h-[300px] items-center justify-center text-sm text-zinc-400">
          No orders found.
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Orders Overview"
      subtitle="Orders received from the database"
    >
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid
              stroke="#27272a"
              vertical={false}
            />

            <XAxis
              dataKey="day"
              stroke="#71717a"
            />

            <YAxis
              allowDecimals={false}
              stroke="#71717a"
            />

            <Tooltip
              contentStyle={{
                background: "#18181b",
                border: "1px solid #27272a",
                borderRadius: 14,
              }}
              formatter={(value) => [
                `${value} orders`,
                "Orders",
              ]}
            />

            <Bar
              dataKey="orders"
              fill="#FF6B35"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}