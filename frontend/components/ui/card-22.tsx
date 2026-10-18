"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Clock, Star, Store } from "lucide-react";
import clsx from "clsx";

import {
  formatPriceRange,
  type DiscoveredStall,
} from "@/app/lib/stallDiscovery";

type StallCard22Props = {
  stall: DiscoveredStall;
  /** Pass only real image URLs if a future API version provides a gallery. */
  images?: string[];
  className?: string;
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: [0.2, 0, 0, 1] },
  },
};

const contentVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.075 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

const carouselVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: { zIndex: 1, x: 0, opacity: 1 },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
  }),
};

export function StallCard22({ stall, images, className }: StallCard22Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const reduceMotion = useReducedMotion() ?? false;
  const priceRange = formatPriceRange(stall);
  const imageSources = Array.from(
    new Set((images?.length ? images : [stall.imageUrl]).map((image) => image.trim()).filter(Boolean))
  );
  const imageCount = imageSources.length;
  const safeIndex = imageCount > 0 ? currentIndex % imageCount : 0;
  const currentImage = imageSources[safeIndex];
  const hasImage = Boolean(currentImage && currentImage !== failedImage);
  const visibleCategories = stall.categories.slice(0, 2);
  const extraCategories = stall.categories.length - visibleCategories.length;

  const changeImage = (nextDirection: -1 | 1) => {
    if (imageCount < 2) return;
    setDirection(nextDirection);
    setCurrentIndex((previous) => (previous + nextDirection + imageCount) % imageCount);
  };

  const showImage = (index: number) => {
    if (imageCount < 2 || index === safeIndex) return;
    setDirection(index > safeIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  return (
    <motion.article
      initial={reduceMotion ? false : "hidden"}
      whileInView={reduceMotion ? undefined : "visible"}
      viewport={{ once: true, amount: 0.2 }}
      variants={cardVariants}
      whileHover={reduceMotion ? undefined : { y: -2, scale: 1.01, boxShadow: "var(--shadow-elevated)" }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={clsx(
        "group/card relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--text-primary)] shadow-[var(--shadow-card)]",
        className
      )}
    >
      {/* Full-card link preserves the existing click-anywhere navigation. */}
      <Link
        href={`/stall/${encodeURIComponent(stall.id)}`}
        aria-label={`Open ${stall.name} menu`}
        className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
      >
        <span className="sr-only">View menu for {stall.name}</span>
      </Link>

      <div className="pointer-events-none relative z-20 flex h-full flex-col">
        <div className="cv-card22__image group relative h-56 overflow-hidden bg-[var(--surface-tertiary)] sm:h-64">
          {hasImage ? (
            <AnimatePresence initial={false} custom={direction} mode="sync">
              <motion.img
                key={currentImage}
                src={currentImage}
                alt={`${stall.name} — image ${safeIndex + 1}`}
                custom={direction}
                variants={carouselVariants}
                initial={reduceMotion ? false : "enter"}
                animate="center"
                exit={reduceMotion ? undefined : "exit"}
                transition={reduceMotion ? { duration: 0 } : {
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                loading="lazy"
                decoding="async"
                draggable={false}
                onError={() => setFailedImage(currentImage ?? null)}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </AnimatePresence>
          ) : (
            <div
              role="img"
              aria-label={`No image available for ${stall.name}`}
              className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--surface-tertiary)] to-[var(--surface-secondary)] text-[var(--text-muted)]"
            >
              <Store size={38} strokeWidth={1.5} aria-hidden="true" />
            </div>
          )}

          {hasImage && (
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10"
            />
          )}

          <div className="absolute left-3 top-3 flex max-w-[72%] flex-wrap gap-1.5">
            <span
              className={`cv-card22__status-badge rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm ${
                stall.isOpen ? "bg-emerald-700/90" : "bg-zinc-800/90"
              }`}
            >
              {stall.isOpen ? "Open" : "Closed"}
            </span>
            {visibleCategories.map((category) => (
              <span
                key={category}
                className="cv-card22__category-badge rounded-full border border-white/25 bg-black/55 px-2.5 py-1 text-[11px] font-semibold shadow-sm backdrop-blur-sm"
              >
                {category}
              </span>
            ))}
            {extraCategories > 0 && (
              <span className="rounded-full border border-white/25 bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white/90 shadow-sm backdrop-blur-sm">
                +{extraCategories}
              </span>
            )}
          </div>

          {stall.rating !== null && (
            <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/25 bg-[var(--card)]/90 px-2.5 py-1 text-xs font-semibold text-[var(--text-primary)] shadow-sm backdrop-blur-sm">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
              {stall.rating.toFixed(1)}
            </span>
          )}

          {imageCount > 1 && (
            <>
              <div className="cv-card22__controls absolute inset-x-2 top-1/2 z-30 flex -translate-y-1/2 justify-between transition-opacity">
                <button
                  type="button"
                  aria-label={`Previous image for ${stall.name}`}
                  onClick={() => changeImage(-1)}
                  className="cv-card22__carousel-button pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/50 shadow-md backdrop-blur-sm transition-colors hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Next image for ${stall.name}`}
                  onClick={() => changeImage(1)}
                  className="cv-card22__carousel-button pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/50 shadow-md backdrop-blur-sm transition-colors hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <div className="absolute bottom-2.5 left-1/2 z-30 flex -translate-x-1/2 gap-1">
                {imageSources.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    aria-label={`Show image ${index + 1} of ${imageCount} for ${stall.name}`}
                    aria-current={safeIndex === index ? "true" : undefined}
                    onClick={() => showImage(index)}
                    className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-white"
                  >
                    <span
                      className={`h-1.5 rounded-full transition-all ${
                        safeIndex === index ? "w-4 bg-white" : "w-1.5 bg-white/60"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <motion.div variants={contentVariants} className="flex flex-1 flex-col space-y-4 p-5">
          <motion.div variants={itemVariants} className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-1 text-lg font-bold tracking-tight text-[var(--text-primary)]">
              {stall.name}
            </h3>
          </motion.div>

          {stall.description && (
            <motion.p
              variants={itemVariants}
              className="line-clamp-2 text-sm leading-relaxed text-[var(--text-secondary)]"
            >
              {stall.description}
            </motion.p>
          )}

          {(stall.prepMinutes !== null || priceRange || stall.isVegOnly) && (
            <motion.div
              variants={itemVariants}
              className="flex min-h-5 flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-[var(--text-muted)]"
            >
              {stall.prepMinutes !== null && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={14} aria-hidden="true" />
                  <span>{stall.prepMinutes} min</span>
                </span>
              )}
              {priceRange && <span>{priceRange}</span>}
              {stall.isVegOnly && <span>Pure Veg</span>}
            </motion.div>
          )}

          <motion.div variants={itemVariants} className="mt-auto pt-1">
            <Link
              href={`/stall/${encodeURIComponent(stall.id)}`}
              className="group/action pointer-events-auto inline-flex h-11 w-full items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] px-4 text-sm font-semibold text-[var(--text-primary)] shadow-[var(--shadow-soft)] transition-colors duration-200 ease-out hover:border-[var(--primary)] hover:bg-[var(--primary)] hover:text-[var(--on-primary)] group-hover/card:border-[var(--primary)] group-hover/card:bg-[var(--primary)] group-hover/card:text-[var(--on-primary)] group-focus-within/card:border-[var(--primary)] group-focus-within/card:bg-[var(--primary)] group-focus-within/card:text-[var(--on-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
            >
              View Menu
              <ArrowRight
                className="ml-2 h-4 w-4 transition-transform group-hover/action:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </motion.article>
  );
}
