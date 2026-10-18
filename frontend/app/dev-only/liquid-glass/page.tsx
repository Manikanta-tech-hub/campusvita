import { notFound } from "next/navigation";
import { LiquidGlassCard } from "@/components/ui/liquid-glass-card";
import { LiquidWeatherGlass } from "@/components/ui/liquid-weather-glass";

function MaterialSample() {
  return (
    <div className="p-6 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/80">
        CampusVita glass lab
      </p>
      <h2 className="mt-3 text-xl font-semibold tracking-tight">Same content, same environment</h2>
      <p className="mt-2 text-sm leading-6 text-white/90">
        Compare blur, tint, edge lighting, and the supplied displacement treatment.
      </p>
      <button
        type="button"
        className="mt-5 h-10 w-full rounded-xl border border-white/35 bg-white/15 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur-md"
      >
        Sample control
      </button>
    </div>
  );
}

export default function LiquidGlassMaterialPage() {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-10 text-[var(--text-primary)] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent-text)]">
          Development-only material check
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Liquid glass environments</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Identical panels and content over matching crops of one local photographic background.
        </p>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <section className="cv-glass-lab__environment">
            <p className="cv-glass-lab__label">A · supplied weather-glass material</p>
            <LiquidWeatherGlass className="cv-glass-lab__surface">
              <MaterialSample />
            </LiquidWeatherGlass>
          </section>

          <section className="cv-glass-lab__environment">
            <p className="cv-glass-lab__label">B · current CampusVita material</p>
            <LiquidGlassCard className="cv-glass-lab__surface cv-glass-lab__campus-surface">
              <MaterialSample />
            </LiquidGlassCard>
          </section>
        </div>
      </div>
    </main>
  );
}
