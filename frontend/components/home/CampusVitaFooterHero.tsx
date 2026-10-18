"use client";

import { Clock3, PackageCheck, Store } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

const animatedTexts = [
  "Discover your next favorite meal.",
  "Skip the queue. Grab your food.",
  "Fresh food, right on campus.",
  "Order ahead. Enjoy more time.",
];

const motionPreference = "(prefers-reduced-motion: reduce)";

function subscribeToMotionPreference(onChange: () => void) {
  const mediaQuery = window.matchMedia(motionPreference);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

function getMotionPreference() {
  return window.matchMedia(motionPreference).matches;
}

function getServerMotionPreference() {
  return false;
}

const features = [
  { title: "Discover", detail: "Campus stalls", Icon: Store },
  { title: "Order ahead", detail: "Save time", Icon: Clock3 },
  { title: "Easy pickup", detail: "Collect food", Icon: PackageCheck },
];

export default function CampusVitaFooterHero() {
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToMotionPreference,
    getMotionPreference,
    getServerMotionPreference
  );
  const [textIndex, setTextIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const fullText = animatedTexts[textIndex];
    const complete = displayText === fullText;
    const shouldPause = complete && !isDeleting;
    const empty = displayText.length === 0;
    const delay = shouldPause ? 2000 : empty && isDeleting ? 0 : isDeleting ? 65 : 120;

    const timer = window.setTimeout(() => {
      if (shouldPause) {
        setIsDeleting(true);
      } else if (empty && isDeleting) {
        setIsDeleting(false);
        setTextIndex((index) => (index + 1) % animatedTexts.length);
      } else if (isDeleting) {
        setDisplayText((current) => current.slice(0, -1));
      } else {
        setDisplayText(fullText.slice(0, displayText.length + 1));
      }
    }, delay);

    return () => window.clearTimeout(timer);
  }, [displayText, isDeleting, prefersReducedMotion, textIndex]);

  return (
    <section
      aria-labelledby="campusvita-closing-heading"
      className="px-4 py-14 sm:px-6 sm:py-20 lg:px-10"
    >
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center shadow-[var(--shadow-card)] sm:px-12 sm:py-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-[var(--primary-soft)] blur-3xl"
        />
        <div className="relative mx-auto max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-secondary)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)]">
            <Store size={14} aria-hidden="true" className="text-[var(--primary)]" />
            Campus food, all in one place
          </span>

          <h2
            id="campusvita-closing-heading"
            className="mt-6 text-3xl font-bold tracking-[-0.045em] text-[var(--text-primary)] sm:text-5xl"
          >
            Less waiting. More campus life.
          </h2>

          <p className="mt-4 text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
            Discover participating campus stalls and order ahead.
          </p>

          <p className="mt-5 flex min-h-[5.25rem] items-center justify-center text-center text-lg font-semibold leading-7 text-[var(--accent-text)] sm:min-h-8 sm:text-xl">
            <span className="sr-only">{animatedTexts[0]}</span>
            <span aria-hidden="true">
              {prefersReducedMotion ? animatedTexts[0] : displayText}
              {!prefersReducedMotion && (
                <span className="cv-typewriter-cursor ml-0.5" aria-hidden="true">
                  |
                </span>
              )}
            </span>
          </p>

          <ul className="mx-auto mt-7 grid max-w-2xl grid-cols-1 divide-y divide-[var(--border)] sm:grid-cols-3 sm:divide-y-0">
            {features.map(({ title, detail, Icon }, index) => (
              <li
                key={title}
                className={`flex items-center justify-center gap-3 py-3 text-left sm:px-4 sm:py-2 ${
                  index > 0 ? "sm:border-l sm:border-[var(--border)]" : ""
                }`}
              >
                <Icon size={19} aria-hidden="true" className="shrink-0 text-[var(--primary)]" />
                <span>
                  <span className="block text-sm font-semibold text-[var(--text-primary)]">
                    {title}
                  </span>
                  <span className="block text-xs text-[var(--text-muted)]">{detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
