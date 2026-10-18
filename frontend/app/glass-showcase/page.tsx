"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Bell, Check, Moon, ShoppingBag, Sun, X } from "lucide-react";
import {
  GlassButton,
  GlassCard,
  IconButton,
  SearchBar,
  SegmentedTabs,
  StatusBadge,
} from "@/components/ui/glass";

type DemoTab = "Popular" | "Vegetarian" | "Quick bites";

export default function GlassShowcasePage() {
  const [dark, setDark] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<DemoTab>("Popular");
  const reduceMotion = useReducedMotion();

  return (
    <main className={dark ? "dark min-h-screen bg-[var(--background)] text-[var(--text-primary)]" : "min-h-screen bg-[var(--background)] text-[var(--text-primary)]"}>
      <div className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-16 pt-5 sm:px-8 sm:pt-8">
        <header className="mb-12 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--primary)]" aria-label="CampusVita home">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--primary)] font-black text-white shadow-[var(--shadow-brand)]">C</span>
            <span>
              <span className="block text-sm font-bold tracking-tight">CampusVita</span>
              <span className="block text-[11px] text-[var(--text-muted)]">Material study</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setDark((value) => !value)}
            aria-label={dark ? "Preview light glass materials" : "Preview dark glass materials"}
            aria-pressed={dark}
            className="cv-glass-subtle cv-showcase-gloss inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
          >
            {dark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
            <span>{dark ? "Light mode" : "Dark mode"}</span>
          </button>
        </header>

        <section className="mb-11 max-w-3xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[var(--primary)]">CampusVita · Interface materials</p>
          <h1 className="text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">Liquid Glass, tuned for campus life.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
            A material study for the ordering experience: soft milky surfaces, directional reflections, fine rims, and confident indigo actions.
          </p>
        </section>

        <div className="mb-10 flex items-center gap-2" aria-label="Material showcase navigation">
          <nav className="cv-glass-elevated cv-showcase-gloss flex min-h-14 items-center gap-1 rounded-full p-1.5" aria-label="Floating navigation preview">
            <a href="#buttons" className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-brand)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Discover</a>
            <a href="#food-card" className="rounded-full px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--primary-soft)] focus-visible:outline-2 focus-visible:outline-[var(--primary)]">Menu</a>
            <a href="#controls" className="hidden rounded-full px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--primary-soft)] focus-visible:outline-2 focus-visible:outline-[var(--primary)] sm:inline-flex">Orders</a>
            <IconButton label="Notifications" size={40} className="cv-glass-subtle cv-showcase-gloss text-[var(--text-primary)]"><Bell size={17} aria-hidden="true" /></IconButton>
            <IconButton label="Shopping bag" size={40} className="cv-glass-subtle cv-showcase-gloss text-[var(--primary)]"><ShoppingBag size={17} aria-hidden="true" /></IconButton>
          </nav>
          <span className="hidden text-xs text-[var(--text-muted)] sm:inline">Floating navigation · elevated</span>
        </div>

        <section id="buttons" className="mb-10 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <GlassCard variant="card" className="cv-showcase-gloss p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">01 · Tactile actions</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">Buttons with a little light.</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">A controlled highlight over clear, high-contrast brand actions.</p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <GlassButton className="cv-showcase-gloss" size="lg"><span>Add to cart</span><ArrowRight size={16} aria-hidden="true" /></GlassButton>
              <GlassButton variant="secondary" size="lg" className="cv-showcase-gloss">View menu</GlassButton>
            </div>
            <p className="mt-6 text-xs text-[var(--text-muted)]">Hover, focus, and press to inspect the interaction.</p>
          </GlassCard>

          <GlassCard id="food-card" as="article" variant="card" hover className="cv-showcase-gloss grid overflow-hidden p-0 sm:grid-cols-[0.92fr_1.08fr]">
            <div className="relative min-h-60 overflow-hidden sm:min-h-[300px]">
              <Image src="/burger-scroll-preview.jpg" alt="CampusVita burger hero still" fill sizes="(max-width: 640px) 100vw, 40vw" className="object-cover" priority />
              <span className="absolute left-4 top-4 z-10"><StatusBadge tone="success">Popular today</StatusBadge></span>
            </div>
            <div className="flex flex-col justify-center p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary)]">02 · Food card</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">The Campus Stack</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Crisp edges for the card; the food image stays sharp, vibrant, and unobstructed.</p>
              <div className="mt-6 flex items-center justify-between gap-4">
                <span className="text-lg font-bold">₹189</span>
                <GlassButton size="md"><span>Add</span><span className="sr-only"> The Campus Stack to cart</span></GlassButton>
              </div>
            </div>
          </GlassCard>
        </section>

        <section id="controls" className="mb-10 grid gap-4 lg:grid-cols-2">
          <GlassCard variant="subtle" className="cv-showcase-gloss p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">03 · Search and filter</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">Soft glass, clear controls.</h2>
            <SearchBar value={search} onChange={setSearch} className="mt-6" placeholder="Search dishes or stalls" label="Search dishes or stalls" />
            <div className="mt-5 overflow-hidden">
              <SegmentedTabs tabs={[{ id: "Popular", label: "Popular", count: 8 }, { id: "Vegetarian", label: "Veg" }, { id: "Quick bites", label: "Quick bites" }]} value={tab} onChange={setTab} ariaLabel="Food category preview" />
            </div>
            <p className="mt-4 text-xs text-[var(--text-muted)]" aria-live="polite">Selected: {tab}{search ? ` · Search: ${search}` : ""}</p>
          </GlassCard>

          <GlassCard variant="card" className="cv-showcase-gloss flex flex-col justify-between p-6 sm:p-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">04 · Modal surface</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">Elevated without losing clarity.</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">A focused confirmation surface with a brighter rim, deeper separation, and readable content.</p>
            </div>
            <div className="mt-7 flex items-center justify-between gap-4">
              <StatusBadge tone="accent">Ready for pickup</StatusBadge>
              <GlassButton onClick={() => setModalOpen(true)}>Preview modal</GlassButton>
            </div>
          </GlassCard>
        </section>

        <section aria-labelledby="recipes-title" className="mb-10">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Material recipes</p>
            <h2 id="recipes-title" className="mt-2 text-xl font-semibold tracking-tight">One family, four levels of clarity.</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <GlassCard variant="card" className="cv-showcase-gloss p-4"><p className="font-semibold">Glossy</p><p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">Directional sheen for focal actions.</p></GlassCard>
            <GlassCard variant="subtle" className="cv-showcase-gloss p-4"><p className="font-semibold">Frosted</p><p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">Quiet, diffused surfaces for controls.</p></GlassCard>
            <GlassCard variant="solid" className="cv-showcase-gloss p-4"><p className="font-semibold">Solid glass</p><p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">Higher opacity for dense content.</p></GlassCard>
            <GlassCard variant="elevated" className="cv-showcase-gloss p-4"><p className="font-semibold">Elevated</p><p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">Stronger depth for floating layers.</p></GlassCard>
          </div>
        </section>

        <section aria-labelledby="dark-surface-title" className="mb-10 overflow-hidden rounded-[28px] bg-[#15151a] p-5 text-white sm:p-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#aeb5ff]">05 · Night material</p>
              <h2 id="dark-surface-title" className="mt-2 text-xl font-semibold tracking-tight">Dark mode keeps the same polish.</h2>
            </div>
            <span className="text-xs text-white/55">Indigo light · silver rim · calm contrast</span>
          </div>
          <div className="dark grid gap-4 sm:grid-cols-2">
            <GlassCard variant="elevated" className="cv-showcase-gloss p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold">Order CV-2048</span>
                <StatusBadge tone="success">Preparing</StatusBadge>
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">A dimensional surface that stays legible against a charcoal canvas.</p>
            </GlassCard>
            <div className="cv-glass-subtle cv-showcase-gloss flex items-center justify-between gap-4 rounded-2xl p-5">
              <div><p className="font-semibold">2 items in your cart</p><p className="mt-1 text-sm text-[var(--text-secondary)]">Ready when you are</p></div>
              <GlassButton size="sm">Checkout</GlassButton>
            </div>
          </div>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-5 text-xs text-[var(--text-muted)]">
          <span>CampusVita · Material showcase</span>
          <span>Visual review gate · No production routes changed here</span>
        </footer>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
            onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="showcase-modal-title"
              className="cv-glass-modal cv-showcase-gloss w-full max-w-md rounded-[28px] p-6 sm:p-8"
              initial={{ opacity: 0, y: reduceMotion ? 0 : 12, scale: reduceMotion ? 1 : 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: reduceMotion ? 0 : 8, scale: reduceMotion ? 1 : 0.99 }}
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]"><Check size={20} aria-hidden="true" /></div>
                <IconButton label="Close modal preview" onClick={() => setModalOpen(false)}><X size={17} aria-hidden="true" /></IconButton>
              </div>
              <h2 id="showcase-modal-title" className="mt-5 text-2xl font-semibold tracking-tight">Order confirmed</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Your meal is on its way to the kitchen. We’ll keep the latest status here.</p>
              <div className="cv-glass-subtle mt-6 rounded-2xl p-4">
                <div className="flex items-center justify-between text-sm"><span className="text-[var(--text-secondary)]">Pickup estimate</span><span className="font-semibold">12:35 PM</span></div>
              </div>
              <GlassButton className="mt-6 w-full" onClick={() => setModalOpen(false)}>Got it</GlassButton>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
