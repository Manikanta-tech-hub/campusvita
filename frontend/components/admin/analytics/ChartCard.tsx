"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export default function ChartCard({
  title,
  subtitle,
  children,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="
      rounded-3xl
      border border-zinc-800
      bg-[#17171f]
      p-6
      shadow-xl
      "
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">
          {title}
        </h2>

        {subtitle && (
          <p className="text-sm text-zinc-400 mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {children}
    </motion.div>
  );
}