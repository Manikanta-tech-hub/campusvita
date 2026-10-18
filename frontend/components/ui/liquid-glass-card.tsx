"use client";

import { useId, type HTMLAttributes, type ReactNode } from "react";
import clsx from "clsx";

type LiquidGlassCardProps = {
  children: ReactNode;
  className?: string;
  variant?: "smoked" | "interactive";
  /** Disable SVG displacement while retaining the CSS backdrop fallback. */
  distortion?: boolean;
  /** Native drag is disabled by default so linked cards remain click-first. */
  draggable?: boolean;
} & Omit<HTMLAttributes<HTMLElement>, "children" | "className" | "draggable">;

/**
 * Layered glass surface for a single focal card. The optical layer only
 * diffuses/displaces the backdrop; content and photography remain untouched.
 */
export function LiquidGlassCard({
  children,
  className,
  variant = "smoked",
  distortion = true,
  draggable = false,
  ...rest
}: LiquidGlassCardProps) {
  const filterId = `cv-glass-displacement-${useId().replace(/:/g, "")}`;

  return (
    <article
      {...rest}
      className={clsx(
        variant === "smoked"
          ? "cv-glass-smoked cv-liquid-glass"
          : "cv-glass-card cv-glass-edge cv-lift",
        className
      )}
      draggable={draggable}
    >
      {variant === "smoked" && (
        <span
          className="cv-liquid-glass__optical"
          data-distortion={distortion ? "true" : undefined}
          style={distortion ? { filter: `url(#${filterId})` } : undefined}
          aria-hidden="true"
        />
      )}

      {variant === "smoked" && distortion && (
        <svg
          className="cv-liquid-glass__filters"
          aria-hidden="true"
          focusable="false"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter
              id={filterId}
              x="-12%"
              y="-12%"
              width="124%"
              height="124%"
              colorInterpolationFilters="sRGB"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.018 0.024"
                numOctaves="1"
                seed="7"
                result="glass-grain"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="glass-grain"
                scale="5"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>
      )}

      {children}
    </article>
  );
}
