"use client";

export default function KPICardSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 animate-pulse">

      <div className="flex items-center justify-between">

        <div className="space-y-3">

          <div className="h-3 w-24 rounded bg-zinc-800" />

          <div className="h-8 w-20 rounded bg-zinc-700" />

          <div className="h-3 w-16 rounded bg-zinc-800" />

        </div>

        <div className="h-14 w-14 rounded-xl bg-zinc-800" />

      </div>

    </div>
  );
}