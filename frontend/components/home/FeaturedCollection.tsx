"use client";
import { useState, useEffect, useCallback } from "react";
import { ArrowRight } from "lucide-react";

const SLIDES = [
  { src: "/images/featured-1.jpg", alt: "Chicken biryani" },
  { src: "/images/featured-2.jpg", alt: "Juicy burger" },
  { src: "/images/featured-3.jpg", alt: "Momos" },
  { src: "/images/featured-4.jpg", alt: "Thick shake" },
];

export default function FeaturedCollection() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, 2000);
    return () => clearInterval(id);
  }, [paused, next]);

  return (
    <section
      className="relative mb-8 overflow-hidden rounded-[28px] shadow-[var(--shadow-card)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative h-[420px] sm:h-[460px] lg:h-[500px]">
        {SLIDES.map((slide, i) => (
          <img
            key={slide.src}
            src={slide.src}
            alt={slide.alt}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center px-8 sm:px-12 lg:px-14">
          <h2 className="max-w-2xl text-3xl font-black leading-[1.05] tracking-[-0.04em] text-[#d6b8ff] sm:text-5xl">
            Your next <span className="text-[#d5544b]">craving</span> starts here.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/90 sm:text-base">
            From irresistible biryani to late-night bites—find the flavors everyone’s craving.
          </p>
          <a
            href="/orders"
            className="mt-6 inline-flex w-fit items-center gap-2 rounded-xl bg-[var(--brand)] px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-[var(--brand-hover)] focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2"
          >
            Find your next favorite <ArrowRight size={18} strokeWidth={2.5} />
          </a>
        </div>
        <div className="absolute bottom-5 right-6 flex gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2 w-2 rounded-full transition-all ${
                i === index ? "w-6 bg-white" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
