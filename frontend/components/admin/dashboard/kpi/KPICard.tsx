"use client";

import { ArrowDownRight, ArrowUpRight, LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  icon: LucideIcon;
  color: string;
}

export default function KPICard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  color,
}: KPICardProps) {
  const positive = (trend ?? 0) >= 0;

  return (
    <motion.div
      whileHover={{
        y: -6,
        scale: 1.02,
      }}
      transition={{
        duration: 0.25,
      }}
      className="rounded-2xl border border-zinc-800 bg-[#17171d] p-6 shadow-lg"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-zinc-400">{title}</p>

          <h2 className="mt-3 text-4xl font-bold text-white">
            {value}
          </h2>

          {subtitle && (
            <p className="mt-2 text-sm text-zinc-500">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: color,
          }}
        >
          <Icon
            size={28}
            className="text-white"
          />
        </div>
      </div>

      {trend !== undefined && (
        <div
          className={`mt-6 flex items-center gap-2 text-sm font-medium ${
            positive
              ? "text-green-400"
              : "text-red-400"
          }`}
        >
          {positive ? (
            <ArrowUpRight size={18} />
          ) : (
            <ArrowDownRight size={18} />
          )}

          {Math.abs(trend)}%

          <span className="text-zinc-500">
            vs last week
          </span>
        </div>
      )}
    </motion.div>
  );
}