"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

const categories = [
  { label: "Burgers", query: "burger", desc: "Juicy campus favorites" },
  { label: "Rice Bowls", query: "rice", desc: "Hearty and balanced" },
  { label: "Snacks", query: "snack", desc: "Quick bites" },
  { label: "Drinks", query: "drink", desc: "Refresh on campus" },
  { label: "Healthy", query: "salad", desc: "Fresh and light" },
  { label: "Spicy", query: "spicy", desc: "Bold flavors" },
];

export default function CategoryExplorer({ activeStalls }: { activeStalls: any[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const matches = useMemo(() => {
    if (!selected) return activeStalls.length;
    return activeStalls.filter((s) =>
      s.name?.toLowerCase().includes(selected.toLowerCase()) ||
      s.description?.toLowerCase().includes(selected.toLowerCase())
    );
  }, [selected, activeStalls]);

  return (
    <section className="mb-10">
      <div className="mb-5 flex items-end justify-between">
        <h2 className="text-xl font-black tracking-[-0.03em] text-[var(--text-primary)]">Browse by taste</h2>
        {selected && (
          <button
            onClick={() => setSelected(null)}
            className="text-xs font-semibold text-[var(--brand)] hover:text-[var(--brand-hover)] transition-colors"
          >
            Clear filter
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.map((cat) => {
          const isActive = selected === cat.query;
          return (
            <button
              key={cat.query}
              onClick={() => {
                setSelected(isActive ? null : cat.query);
                if (!isActive) router.push(`/stall/search?q=${cat.query}`);
              }}
              aria-pressed={isActive}
              className={`group relative overflow-hidden rounded-2xl border text-left transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] ${
                isActive
                  ? "border-[var(--brand)] shadow-[var(--shadow-card)]"
                  : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-soft)]"
              }`}
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-[var(--surface-secondary)]">
                <img
                  src={`https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80&auto=format`}
                  alt={cat.label}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className={`text-sm font-bold tracking-tight ${isActive ? "text-white" : "text-[var(--text-primary)]"}`}>
                  {cat.label}
                </h3>
                <p className={`text-[10px] leading-4 ${isActive ? "text-white/80" : "text-[var(--text-muted)]"}`}>
                  {cat.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-3 text-xs text-[var(--text-muted)]">{matches} stalls match your selection</div>
    </section>
  );
}
