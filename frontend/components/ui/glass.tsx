"use client";

import React from "react";
import clsx from "clsx";
import { Loader2, Search, X } from "lucide-react";

/* =========================================================
   CAMPUSVITA GLASS PRIMITIVES
   Shared liquid-glass building blocks used across the
   student, vendor and admin experiences.

   Material variants map to the `.cv-glass-*` utilities
   defined in app/globals.css (with opaque fallbacks).
   ========================================================= */

/* ---------------------------------------------------------
   GLASS SURFACE
--------------------------------------------------------- */

type GlassVariant = "card" | "subtle" | "elevated" | "modal" | "dark" | "solid";

const glassMaterial: Record<GlassVariant, string> = {
  card: "cv-glass-card",
  subtle: "cv-glass-subtle",
  elevated: "cv-glass-elevated",
  modal: "cv-glass-modal",
  dark: "cv-glass-dark",
  solid: "border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]",
};

type GlassSurfaceVariant = "smoked" | "elevated" | "interactive" | "subtle";

const glassSurfaceMaterial: Record<GlassSurfaceVariant, string> = {
  smoked: "cv-glass-smoked",
  elevated: "cv-glass-elevated cv-glass-edge",
  interactive: "cv-glass-card cv-glass-edge cv-lift",
  subtle: "cv-glass-subtle cv-glass-edge",
};

/** A reusable material wrapper for content surfaces. */
export function GlassSurface({
  variant = "smoked",
  className,
  children,
  as = "div",
  ...rest
}: {
  variant?: GlassSurfaceVariant;
  className?: string;
  children: React.ReactNode;
  as?: "div" | "article" | "section";
} & Omit<React.HTMLAttributes<HTMLElement>, "children">) {
  const Tag = as as unknown as React.ComponentType<
    React.HTMLAttributes<HTMLElement> & { className?: string }
  >;

  return (
    <Tag
      className={clsx(glassSurfaceMaterial[variant], className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function GlassCard({
  variant = "card",
  className,
  children,
  hover = false,
  as,
  ...rest
}: {
  variant?: GlassVariant;
  className?: string;
  children: React.ReactNode;
  hover?: boolean;
  as?: "div" | "article" | "section" | "aside" | "li";
} & Omit<React.HTMLAttributes<HTMLElement>, "children">) {
  const Tag = (as ?? "div") as unknown as React.ComponentType<
    React.HTMLAttributes<HTMLElement> & { className?: string }
  >;

  return (
    <Tag
      className={clsx(
        glassMaterial[variant],
        "cv-glass-edge rounded-2xl",
        hover && "cv-lift",
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* ---------------------------------------------------------
   GLASS PANEL — section container
--------------------------------------------------------- */

export function GlassPanel({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={clsx(
        "cv-glass-card cv-glass-edge rounded-2xl p-4 sm:p-5",
        className
      )}
      {...rest}
    >
      {children}
    </section>
  );
}

/* ---------------------------------------------------------
   BUTTON
--------------------------------------------------------- */

type ButtonVariant = "primary" | "accent" | "secondary" | "ghost" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const buttonVariants: Record<ButtonVariant, string> = {
  /* Near-black — the everyday premium CTA */
  primary:
    "bg-[var(--primary)] text-[var(--on-primary)] border border-transparent hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)] shadow-[0_4px_14px_rgba(0,0,0,0.12)]",
  /* Orange — reserved for strategic conversion actions */
  accent:
    "bg-[var(--accent)] text-[var(--on-accent)] border border-transparent hover:bg-[var(--accent-hover)] active:bg-[var(--accent-active)] shadow-[var(--accent-shadow)]",
  secondary:
    "cv-glass-subtle text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]",
  ghost:
    "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--primary-soft)] hover:text-[var(--text-primary)]",
  outline:
    "bg-transparent text-[var(--text-primary)] border border-[var(--border-strong)] hover:bg-[var(--primary-soft)]",
  danger:
    "bg-[var(--danger)] text-white border border-transparent hover:opacity-90",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-5 text-[15px] gap-2 rounded-xl",
};

export function GlassButton({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className,
  children,
  type = "button",
  ...rest
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={clsx(
        "inline-flex select-none items-center justify-center font-semibold tracking-[-0.01em] transition-all duration-[140ms] ease-[var(--ease-standard)]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]",
        "disabled:pointer-events-none disabled:opacity-50",
        "active:scale-[0.98]",
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      {...rest}
    >
      {loading && (
        <Loader2 size={15} className="animate-spin" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}

/* ---------------------------------------------------------
   ICON BUTTON
--------------------------------------------------------- */

export function IconButton({
  label,
  className,
  children,
  size = 40,
  ...rest
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
  size?: number;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      style={{ width: size, height: size }}
      className={clsx(
        "inline-flex shrink-0 items-center justify-center rounded-full text-[var(--text-secondary)]",
        "transition-all duration-[140ms] ease-[var(--ease-standard)]",
        "hover:bg-[var(--primary-soft)] hover:text-[var(--text-primary)]",
        "active:scale-95",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ---------------------------------------------------------
   STATUS BADGE
   Never relies on color alone — includes a text label and
   an optional leading dot.
--------------------------------------------------------- */

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info" | "accent";

const badgeTones: Record<BadgeTone, string> = {
  neutral:
    "bg-[var(--surface-tertiary)] text-[var(--text-secondary)] border-[var(--border)]",
  success:
    "bg-[var(--success-soft)] text-[var(--success)] border-[color-mix(in_srgb,var(--success)_18%,transparent)]",
  warning:
    "bg-[var(--warning-soft)] text-[var(--warning)] border-[color-mix(in_srgb,var(--warning)_18%,transparent)]",
  danger:
    "bg-[var(--danger-soft)] text-[var(--danger)] border-[color-mix(in_srgb,var(--danger)_18%,transparent)]",
  info:
    "bg-[var(--info-soft)] text-[var(--info)] border-[color-mix(in_srgb,var(--info)_18%,transparent)]",
  accent:
    "bg-[var(--accent-soft)] text-[var(--accent-text)] border-[color-mix(in_srgb,var(--accent)_20%,transparent)]",
};

const badgeDot: Record<BadgeTone, string> = {
  neutral: "bg-[var(--text-muted)]",
  success: "bg-[var(--success)]",
  warning: "bg-[var(--warning)]",
  danger: "bg-[var(--danger)]",
  info: "bg-[var(--info)]",
  accent: "bg-[var(--accent)]",
};

export function StatusBadge({
  tone = "neutral",
  dot = true,
  className,
  children,
}: {
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em]",
        badgeTones[tone],
        className
      )}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={clsx("h-1.5 w-1.5 shrink-0 rounded-full", badgeDot[tone])}
        />
      )}
      {children}
    </span>
  );
}

/* ---------------------------------------------------------
   FILTER CHIP
--------------------------------------------------------- */

export function FilterChip({
  active = false,
  className,
  children,
  ...rest
}: {
  active?: boolean;
  className?: string;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={clsx(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition-all duration-[140ms] ease-[var(--ease-standard)]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]",
        active
          ? "border-transparent bg-[var(--primary)] text-[var(--on-primary)] shadow-[0_2px_10px_rgba(0,0,0,0.12)]"
          : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ---------------------------------------------------------
   SEGMENTED TABS
--------------------------------------------------------- */

export function SegmentedTabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
  ariaLabel,
}: {
  tabs: { id: T; label: string; count?: number }[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={clsx(
        "cv-glass-subtle inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full p-1",
        className
      )}
    >
      {tabs.map((tab) => {
        const selected = tab.id === value;

        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={clsx(
              "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition-all duration-[180ms] ease-[var(--ease-standard)]",
              "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--primary)]",
              selected
                ? "bg-[var(--primary)] text-[var(--on-primary)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--primary-soft)] hover:text-[var(--text-primary)]"
            )}
          >
            {tab.label}
            {typeof tab.count === "number" && (
              <span
                className={clsx(
                  "cv-tnum rounded-full px-1.5 py-px text-[10px] font-bold",
                  selected
                    ? "bg-white/20 text-[var(--on-primary)]"
                    : "bg-[var(--surface-tertiary)] text-[var(--text-muted)]"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------
   SEARCH BAR
--------------------------------------------------------- */

export function SearchBar({
  value,
  onChange,
  onClear,
  placeholder = "Search...",
  label = "Search",
  className,
  autoFocus = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  label?: string;
  className?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className={clsx("relative", className)}>
      <Search
        size={18}
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
      />

      <input
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="cv-glass-subtle h-12 w-full rounded-full pl-11 pr-11 text-sm text-[var(--text-primary)] outline-none transition-all duration-[160ms] placeholder:text-[var(--text-muted)] hover:border-[var(--border-strong)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft-strong)]"
      />

      {value.length > 0 && (
        <button
          type="button"
          onClick={onClear ?? (() => onChange(""))}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--primary-soft)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   PAGE / SECTION HEADERS
--------------------------------------------------------- */

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={clsx(
        "mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-[1.1] tracking-[-0.03em] text-[var(--text-primary)]">
          {title}
        </h1>

        {subtitle && (
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            {subtitle}
          </p>
        )}
      </div>

      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

export function SectionHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "mb-4 flex items-end justify-between gap-4",
        className
      )}
    >
      <div className="min-w-0">
        <h2 className="text-lg font-bold tracking-[-0.02em] text-[var(--text-primary)] sm:text-xl">
          {title}
        </h2>

        {subtitle && (
          <p className="mt-0.5 text-[13px] text-[var(--text-secondary)]">
            {subtitle}
          </p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ---------------------------------------------------------
   STAT CARD
--------------------------------------------------------- */

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "neutral" | "accent" | "success" | "danger";
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "cv-glass-card cv-lift rounded-2xl p-4 sm:p-5",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
          {label}
        </p>

        {icon && (
          <span
            className={clsx(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
              tone === "accent"
                ? "bg-[var(--accent-soft)] text-[var(--accent-text)]"
                : "bg-[var(--surface-tertiary)] text-[var(--text-secondary)]"
            )}
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
      </div>

      <p className="cv-tnum mt-3 text-2xl font-bold tracking-[-0.02em] text-[var(--text-primary)] sm:text-[28px]">
        {value}
      </p>

      {hint && (
        <div className="mt-1.5 text-[12px] text-[var(--text-muted)]">{hint}</div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   EMPTY / ERROR / LOADING STATES
--------------------------------------------------------- */

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "cv-glass-card flex flex-col items-center rounded-2xl px-6 py-12 text-center",
        className
      )}
    >
      {icon && (
        <div
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-tertiary)] text-[var(--text-muted)]"
          aria-hidden="true"
        >
          {icon}
        </div>
      )}

      <h3 className="text-base font-bold text-[var(--text-primary)]">{title}</h3>

      {description && (
        <p className="mt-1.5 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
          {description}
        </p>
      )}

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
  retryLabel = "Try again",
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={clsx(
        "rounded-2xl border border-[color-mix(in_srgb,var(--danger)_22%,transparent)] bg-[var(--danger-soft)] p-5",
        className
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--danger)]">{title}</h3>

          {description && (
            <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)] sm:text-sm">
              {description}
            </p>
          )}
        </div>

        {onRetry && (
          <GlassButton variant="outline" size="sm" onClick={onRetry}>
            {retryLabel}
          </GlassButton>
        )}
      </div>
    </div>
  );
}

export function Skeleton({
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={clsx(
        "animate-pulse rounded-xl bg-[var(--surface-tertiary)]",
        className
      )}
      {...rest}
    />
  );
}

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 py-16 text-[var(--text-muted)]"
    >
      <Loader2 size={22} className="animate-spin" aria-hidden="true" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
