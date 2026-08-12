"use client";

export default function TableSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 animate-pulse">

      <div className="h-6 w-44 rounded bg-zinc-800 mb-6" />

      {[...Array(6)].map((_, index) => (
        <div
          key={index}
          className="flex items-center justify-between py-4 border-b border-zinc-800"
        >
          <div className="flex items-center gap-4">

            <div className="h-12 w-12 rounded-xl bg-zinc-800" />

            <div className="space-y-2">

              <div className="h-4 w-36 rounded bg-zinc-800" />

              <div className="h-3 w-24 rounded bg-zinc-700" />

            </div>

          </div>

          <div className="h-8 w-20 rounded bg-zinc-800" />

        </div>
      ))}

    </div>
  );
}