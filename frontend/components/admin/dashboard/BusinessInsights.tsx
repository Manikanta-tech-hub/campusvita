"use client";

import { motion } from "framer-motion";
import {
  ClipboardList,
  Clock3,
  Clock2,
  CheckCircle2,
  IndianRupee,
} from "lucide-react";

type Props = {
    revenue: number;
    todayRevenue: number;
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    peakOrderingHours: string;
  };
  export default function BusinessInsights({
    revenue,
    todayRevenue,
    totalOrders,
    completedOrders,
    pendingOrders,
    peakOrderingHours,
  }: Props) {
  const safeTodayRevenue = Number(todayRevenue ?? 0);

  const insights = [
    {
        title: "Total Orders",
        value: totalOrders.toLocaleString("en-IN"),
        icon: ClipboardList,
        color: "text-green-400",
      },
      {
        title: "Peak Ordering Hours",
        value: peakOrderingHours,
        icon: Clock3,
        color: "text-orange-400",
      },
    {
        title: "Completed Orders",
        value: completedOrders.toLocaleString(),
        icon: CheckCircle2,
        color: "text-green-400",
      },
      {
        title: "Pending Orders",
        value: pendingOrders.toLocaleString(),
        icon: Clock3,
        color: "text-orange-400",
      },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-3">

      {/* ================= TOTAL REVENUE PER DAY ================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-3xl border border-white/10 bg-[#15161d] p-8"
      >
        <div className="flex items-center gap-3">
          <IndianRupee
            className="text-orange-500"
            size={28}
          />

          <h2 className="text-xl font-semibold text-white">
            Total Revenue Per Day
          </h2>
        </div>

        <div className="mt-12">
          <p className="text-4xl font-bold text-orange-500">
            ₹{safeTodayRevenue.toLocaleString("en-IN")}
          </p>

          <p className="mt-3 text-lg text-zinc-400">
            Today
          </p>
        </div>
      </motion.div>

      {/* ================= OTHER INSIGHTS ================= */}
      <div className="lg:col-span-2 grid gap-5 md:grid-cols-2">

        {insights.map((item, index) => {
          const Icon = item.icon;

          return (
            <motion.div
              key={item.title}
              initial={{
                opacity: 0,
                y: 15,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: index * 0.1,
              }}
              className="rounded-3xl border border-white/10 bg-[#15161d] p-6"
            >
              <div className="flex items-center justify-between">

                <Icon
                  className={item.color}
                  size={26}
                />

                <span className="text-green-400 text-sm">
                  ↑ Healthy
                </span>

              </div>

              <h3 className="mt-6 text-zinc-400 leading-tight">
                {item.title}
              </h3>

              <p className="mt-2 text-2xl font-bold text-white whitespace-nowrap">
                {item.value}
              </p>
            </motion.div>
          );
        })}

      </div>

    </div>
  );
}