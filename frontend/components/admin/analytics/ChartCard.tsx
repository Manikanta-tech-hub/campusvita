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
    <div className="w-full min-w-0 overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition-colors duration-200">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-primary">
          {title}
        </h2>

        {subtitle && (
          <p className="mt-1 text-sm text-text-secondary">
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