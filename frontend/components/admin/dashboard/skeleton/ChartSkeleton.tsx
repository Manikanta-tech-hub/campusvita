"use client";

export default function ChartSkeleton() {
    const bars = [35, 60, 45, 75, 55, 80, 50, 70];
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 animate-pulse">

      <div className="h-6 w-40 rounded bg-zinc-800 mb-8" />

      <div className="flex items-end gap-4 h-72">
  {bars.map((height, i) => (
    <div
      key={i}
      className="flex-1 rounded-t-xl bg-zinc-800"
      style={{
        height: `${height}%`,
      }}
    />
  ))}
</div>
      </div>
  );
}