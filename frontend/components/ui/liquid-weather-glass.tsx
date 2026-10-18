"use client";

import { useId, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import clsx from "clsx";

type GlassIntensity = "none" | "xs" | "sm" | "md" | "lg" | "xl";
type BlurIntensity = "sm" | "md" | "lg" | "xl";

export type LiquidWeatherGlassProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "draggable"
> & {
  children: ReactNode;
  draggable?: boolean;
  width?: string;
  height?: string;
  blurIntensity?: BlurIntensity;
  shadowIntensity?: GlassIntensity;
  borderRadius?: string;
  glowIntensity?: GlassIntensity;
};

const blurValues: Record<BlurIntensity, string> = {
  sm: "4px",
  md: "8px",
  lg: "12px",
  xl: "24px",
};

const rimShadows: Record<GlassIntensity, string> = {
  none: "inset 0 0 0 0 transparent",
  xs: "inset 1px 1px 1px rgba(255,255,255,.30), inset -1px -1px 1px rgba(255,255,255,.30)",
  sm: "inset 2px 2px 2px rgba(255,255,255,.35), inset -2px -2px 2px rgba(255,255,255,.35)",
  md: "inset 3px 3px 3px rgba(255,255,255,.45), inset -3px -3px 3px rgba(255,255,255,.45)",
  lg: "inset 4px 4px 4px rgba(255,255,255,.50), inset -4px -4px 4px rgba(255,255,255,.50)",
  xl: "inset 6px 6px 6px rgba(255,255,255,.55), inset -6px -6px 6px rgba(255,255,255,.55)",
};

const glowShadows: Record<GlassIntensity, string> = {
  none: "0 4px 4px rgba(0,0,0,.05), 0 0 12px rgba(0,0,0,.05)",
  xs: "0 4px 4px rgba(0,0,0,.15), 0 0 12px rgba(0,0,0,.08), 0 0 16px rgba(255,255,255,.05)",
  sm: "0 4px 4px rgba(0,0,0,.15), 0 0 12px rgba(0,0,0,.08), 0 0 24px rgba(255,255,255,.10)",
  md: "0 4px 4px rgba(0,0,0,.15), 0 0 12px rgba(0,0,0,.08), 0 0 32px rgba(255,255,255,.15)",
  lg: "0 4px 4px rgba(0,0,0,.15), 0 0 12px rgba(0,0,0,.08), 0 0 40px rgba(255,255,255,.20)",
  xl: "0 4px 4px rgba(0,0,0,.15), 0 0 12px rgba(0,0,0,.08), 0 0 48px rgba(255,255,255,.25)",
};

/**
 * Typed, non-draggable adaptation of the supplied weather-glass surface.
 * Its SVG displacement is retained for comparison, not asserted to refract
 * the backdrop; browser validation is required before relying on that effect.
 */
export function LiquidWeatherGlass({
  children,
  className,
  draggable = false,
  width,
  height,
  blurIntensity = "xl",
  shadowIntensity = "md",
  borderRadius = "32px",
  glowIntensity = "sm",
  style,
  ...props
}: LiquidWeatherGlassProps) {
  const filterId = `weather-glass-${useId().replace(/:/g, "")}`;
  const surfaceStyle: CSSProperties = {
    ...style,
    borderRadius,
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
  };

  return (
    <div
      {...props}
      className={clsx("cv-weather-glass relative", className)}
      style={surfaceStyle}
      draggable={draggable}
    >
      <svg
        className="cv-weather-glass__filter"
        aria-hidden="true"
        focusable="false"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter
            id={filterId}
            x="0"
            y="0"
            width="100%"
            height="100%"
            filterUnits="objectBoundingBox"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.003 0.007"
              numOctaves="1"
              result="turbulence"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="turbulence"
              scale="200"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <span
        className="cv-weather-glass__backdrop"
        aria-hidden="true"
        style={{
          borderRadius,
          backdropFilter: `blur(${blurValues[blurIntensity]})`,
          WebkitBackdropFilter: `blur(${blurValues[blurIntensity]})`,
          filter: `url(#${filterId})`,
        }}
      />
      <span
        className="cv-weather-glass__face"
        aria-hidden="true"
        style={{ borderRadius, boxShadow: glowShadows[glowIntensity] }}
      />
      <span
        className="cv-weather-glass__rim"
        aria-hidden="true"
        style={{ borderRadius, boxShadow: rimShadows[shadowIntensity] }}
      />
      <div className="cv-weather-glass__content">{children}</div>
    </div>
  );
}
