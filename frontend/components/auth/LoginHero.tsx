"use client";

import { motion } from "framer-motion";

import {
  ShieldCheck,
  UtensilsCrossed,
  Zap,
} from "lucide-react";

import BrandLogo from "@/components/branding/BrandLogo";

/*
  NOTE ON TEXT COLOURS

  globals.css ships unlayered element rules (h1..h6, p, a, button) and a
  light-theme `.text-white` override. Unlayered / !important author CSS beats
  Tailwind utilities (which live in @layer utilities), so every colour utility
  in the login UI uses the trailing `!` important modifier.
*/

const EASE: [number, number, number, number] = [
  0.22, 1, 0.36, 1,
];

const HIGHLIGHTS = [
  {
    label: "Live order tracking",
    icon: Zap,
  },
  {
    label: "Secure payments",
    icon: ShieldCheck,
  },
  {
    label: "Campus-wide menus",
    icon: UtensilsCrossed,
  },
];

export default function LoginHero() {
  return (
    <aside className="relative isolate flex h-[40dvh] min-h-[300px] w-full shrink-0 flex-col overflow-hidden md:h-auto md:min-h-full">
      {/* BACKGROUND IMAGE */}

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('/images/login-background.jpeg')",
        }}
      />

      {/* DARK OVERLAY */}

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/35 md:bg-gradient-to-br md:from-black/85 md:via-black/50 md:to-black/70"
      />

      {/* BRAND GLOW */}

      <div
        aria-hidden="true"
        className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-hover/30 blur-3xl md:-left-32 md:-top-32 md:h-96 md:w-96"
      />

      {/* CONTENT */}

      <div className="relative z-10 flex h-full flex-1 flex-col justify-between gap-10 p-6 pb-16 sm:p-8 sm:pb-16 md:p-10 lg:p-14">
        {/* LOGO */}

        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="flex items-center gap-3"
        >
          <BrandLogo plate className="h-10 sm:h-11" />
        </motion.div>

        {/* COPY */}

        <div>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: 0.08,
              ease: EASE,
            }}
            className="text-xs font-semibold uppercase tracking-[0.22em] text-brand!"
          >
            Smart campus food
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.55,
              delay: 0.16,
              ease: EASE,
            }}
            className="mt-3 text-[clamp(32px,4.8vw,58px)] font-extrabold leading-[1.03] tracking-[-0.03em] text-white! [text-shadow:0_2px_16px_rgba(0,0,0,0.35)]"
          >
            From Classrooms
            <br />
            to{" "}
            <span className="bg-gradient-to-r from-brand via-brand to-brand bg-clip-text text-transparent">
              Cravings.
            </span>
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.55,
              delay: 0.26,
              ease: EASE,
            }}
            className="mt-4 hidden max-w-md text-sm leading-relaxed text-white/75! md:block md:text-base"
          >
            Fresh food from your campus canteen —
            browse, order and track everything without
            leaving your desk.
          </motion.p>

          {/* HIGHLIGHTS */}

          <motion.ul
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.55,
              delay: 0.36,
              ease: EASE,
            }}
            className="mt-6 hidden flex-wrap gap-2.5 md:flex"
          >
            {HIGHLIGHTS.map(
              ({ label, icon: Icon }) => (
                <li
                  key={label}
                  className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/85 backdrop-blur-sm"
                >
                  <Icon
                    size={14}
                    strokeWidth={2.2}
                    className="text-brand!"
                  />

                  {label}
                </li>
              )
            )}
          </motion.ul>
        </div>
      </div>
    </aside>
  );
}
