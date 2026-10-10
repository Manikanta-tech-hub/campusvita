"use client";
import { ArrowRight, Truck, ShieldCheck, Clock } from "lucide-react";

export default function ConvenienceStrip() {
  return (
    <section className="mb-8">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] px-5 py-4 shadow-[var(--shadow-soft)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-xs font-medium text-[var(--text-secondary)]">
            <span className="flex items-center gap-2"><Truck size={16} className="text-[var(--brand)]" /> Campus delivery</span>
            <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-[var(--success)]" /> Secure checkout</span>
            <span className="flex items-center gap-2"><Clock size={16} className="text-[var(--warning)]" /> Live status</span>
          </div>
          <a href="/orders" className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--brand)] px-4 py-2 text-xs font-bold text-white shadow-[var(--shadow-brand)] hover:-translate-y-0.5 hover:bg-[var(--brand-hover)] transition-all focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-secondary)]">Track orders <ArrowRight size={14} /></a>
        </div>
      </div>
    </section>
  );
}
