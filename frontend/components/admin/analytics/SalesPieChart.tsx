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
import { getSalesDistribution } from "@/app/lib/api";

type Category = {
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

function getCurrentMonth() {
  const now = new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
}

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

export default function SalesPieChart() {
  const [month, setMonth] = useState(
    getCurrentMonth()
  );

  const [categories, setCategories] = useState<
    Category[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(false);

  const monthOptions = getMonthOptions();

  useEffect(() => {
    let mounted = true;

    async function loadSalesDistribution() {
      try {
        setLoading(true);
        setError(false);

        const data =
          await getSalesDistribution(month);

        if (!mounted) {
          return;
        }

        setCategories(
          Array.isArray(data.categories)
            ? data.categories
            : []
        );
      } catch (err) {
        console.error(
          "Failed to load sales distribution:",
          err
        );

        if (mounted) {
          setCategories([]);
          setError(true);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadSalesDistribution();

    const interval = setInterval(() => {
      loadSalesDistribution();
    }, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [month]);

  const chartData = categories.map(
    (category) => ({
      name: category.name,
      value: category.percentage,
      quantity: category.quantity,
    })
  );

  const monthLabel = new Date(
    `${month}-01T00:00:00`
  ).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <ChartCard
      title="Sales Distribution"
      subtitle={`Category wise sales • ${monthLabel}`}
    >
      {/* Month selector */}
      <div className="mb-4 flex justify-end">
        <select
          value={month}
          onChange={(e) =>
            setMonth(e.target.value)
          }
          className="rounded-xl border border-white/10 bg-[#18181b] px-4 py-2 text-sm text-white outline-none focus:border-orange-500"
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

      {/* API error */}
      {!loading && error && (
        <div className="flex h-[300px] items-center justify-center text-sm text-red-400">
          Failed to load sales data.
        </div>
      )}

      {/* No sales */}
      {!loading &&
        !error &&
        chartData.length === 0 && (
          <div className="flex h-[300px] items-center justify-center text-sm text-zinc-400">
            No sales data
          </div>
        )}

      {/* Real sales chart */}
      {!loading &&
        !error &&
        chartData.length > 0 && (
          <div className="w-full">
            <div className="h-[280px] w-full">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {chartData.map(
                      (_, index) => (
                        <Cell
                          key={`category-${index}`}
                          fill={
                            COLORS[
                              index %
                                COLORS.length
                            ]
                          }
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip
                    contentStyle={{
                      background:
                        "#18181b",
                      border:
                        "1px solid #27272a",
                      borderRadius: 14,
                    }}
                    formatter={(value) => [
                      `${value}%`,
                      "Sales",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Real database categories */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {categories.map(
                (category, index) => (
                  <div
                    key={category.name}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            COLORS[
                              index %
                                COLORS.length
                            ],
                        }}
                      />

                      <span className="truncate text-sm text-zinc-300">
                        {category.name}
                      </span>
                    </div>

                    <span className="shrink-0 text-sm font-semibold text-white">
                      {category.percentage}%
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        )}
    </ChartCard>
  );
}