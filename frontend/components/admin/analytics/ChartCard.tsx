"use client";

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
    <div className="w-full min-w-0 overflow-hidden rounded-3xl border border-zinc-800 bg-[#17171f] p-6 shadow-xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">
          {title}
        </h2>

        {subtitle && (
          <p className="mt-1 text-sm text-zinc-400">
            {subtitle}
          </p>
        )}
      </div>

      <div className="w-full min-w-0">
        {children}
      </div>
    </div>
  );
}
