"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

import ChartCard from "./ChartCard";
import { getTopSellingFoods } from "@/app/lib/api";

type Food = {
  name: string;
  quantity: number;
  percentage: number;
};

const COLORS = [
  "#FF6B35",
  "#F59E0B",
  "#3B82F6",
  "#10B981",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
];

function getMonthOptions() {
    const options = [];
    const now = new Date();
  
    for (let i = 0; i < 12; i++) {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1
      );
  
      const value = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
  
      const label = date.toLocaleDateString(
        "en-US",
        {
          month: "long",
          year: "numeric",
        }
      );
  
      options.push({
        value,
        label,
      });
    }
  
    return options;
  }


export default function TopSellingChart() {
    const monthOptions = getMonthOptions();
  const [month, setMonth] = useState(() => {
    const now = new Date();

    return `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;
  });

  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadFoods() {
      try {
        setLoading(true);
        setError(false);

        const data =
          await getTopSellingFoods(month);

        if (!mounted) return;

        setFoods(
          Array.isArray(data.foods)
            ? data.foods
            : []
        );
      } catch (err) {
        console.error(
          "Failed to load top selling foods:",
          err
        );

        if (mounted) {
          setFoods([]);
          setError(true);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadFoods();

    return () => {
      mounted = false;
    };
  }, [month]);

  const chartData = foods.map((food) => ({
    name: food.name,
    value: food.percentage,
    quantity: food.quantity,
  }));

  const monthLabel = new Date(
    `${month}-01T00:00:00`
  ).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <ChartCard
      title="Top Selling Foods"
      subtitle={`Sales distribution by menu item • ${monthLabel}`}
    >
      {/* Month selector */}
      <div className="mb-6 flex justify-end">
      <select
  value={month}
  onChange={(e) => setMonth(e.target.value)}
  className="rounded-xl border border-white/10 bg-[#18181b] px-4 py-2 text-sm text-white outline-none transition focus:border-orange-500"
>
  {monthOptions.map((option) => (
    <option
      key={option.value}
      value={option.value}
      className="bg-[#18181b] text-white"
    >
      {option.label}
    </option>
  ))}
</select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex h-[300px] items-center justify-center text-sm text-zinc-400">
          Loading sales data...
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex h-[300px] items-center justify-center text-sm text-red-400">
          Failed to load sales data.
        </div>
      )}

      {/* Empty */}
      {!loading &&
        !error &&
        chartData.length === 0 && (
          <div className="flex h-[300px] items-center justify-center text-sm text-zinc-400">
            No sales data
          </div>
        )}

        {/* Chart */}
{!loading &&
  !error &&
  chartData.length > 0 && (
    <div className="grid w-full grid-cols-1 items-center gap-6 md:grid-cols-[minmax(0,1fr)_190px]">

      {/* Donut Chart */}
      <div className="h-[300px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={105}
              paddingAngle={2}
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip
              contentStyle={{
                background: "#18181b",
                border: "1px solid #27272a",
                borderRadius: 14,
              }}
              formatter={(value, name, item) => {
                const payload = item?.payload as {
                  quantity?: number;
                };

                return [
                  `${payload.quantity ?? 0} sold (${value}%)`,
                  name,
                ];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex w-full flex-col justify-center gap-5">
        {foods.map((food, index) => (
          <div
            key={food.name}
            className="flex w-full items-center justify-between gap-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="h-3.5 w-3.5 shrink-0 rounded-full"
                style={{
                  backgroundColor:
                    COLORS[index % COLORS.length],
                }}
              />

              <span className="truncate text-sm text-zinc-300">
                {food.name}
              </span>
            </div>

            <span className="shrink-0 text-sm font-semibold text-white">
              {food.percentage}%
            </span>
          </div>
        ))}
      </div>

    </div>
  )}
  
    </ChartCard>
  );
}