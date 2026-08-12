"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ShoppingBag,
  IndianRupee,
  Clock3,
} from "lucide-react";

type Props = {
  adminName: string;
  revenue: number;
  totalOrders: number;
  pendingOrders: number;
};

export default function HeroSection({
  adminName,
  revenue,
  totalOrders,
  pendingOrders,
}: Props) {
  const goal = 50000;
  const progress = Math.min((revenue / goal) * 100, 100);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1b1c26] via-[#16171f] to-[#101118] p-8"
    >
      <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />

      <div className="relative flex flex-col gap-10 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm text-zinc-400">{today}</p>

          <h1 className="mt-2 text-4xl font-bold text-white">
            Welcome back,
            <span className="text-orange-500"> {adminName}</span>
          </h1>

          <p className="mt-4 max-w-xl text-zinc-400">
            Monitor orders, revenue, customers and canteen performance
            from one place.
          </p>
          </div>
        </div>

        <div className="grid w-full max-w-lg grid-cols-3 gap-5">

        </div>
    </motion.section>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
}: {
  icon: any;
  title: string;
  value: string;
}) {
}