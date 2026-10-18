"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";

/* =========================================================
   FLOATING PANEL PRIMITIVES
   Popovers are portaled to document.body and positioned
   with `position: fixed` measured from their trigger.
   This makes them immune to ancestor overflow clipping,
   transformed/backdrop-filter stacking contexts, tiny
   flex wrappers and any layout participation — they can
   never push the stall grid down or collapse in size.
========================================================= */

export type AnchoredPosition = {
  top: number;
  right: number;
  maxHeight: number;
};

const subscribeNothing = () => () => {};

/**
 * Measures the trigger and computes a fixed position for a
 * popover anchored below it (right-aligned). Call `measure()`
 * right before opening; scroll (capture) and resize keep it
 * aligned while open.
 */
export function useAnchoredPosition(
  triggerRef: React.RefObject<HTMLElement | null>,
  open: boolean,
  options: { gap?: number; margin?: number } = {}
): { position: AnchoredPosition | null; measure: () => void } {
  const { gap = 8, margin = 12 } = options;
  const [position, setPosition] = useState<AnchoredPosition | null>(null);

  const measure = useCallback(() => {
    const element = triggerRef.current;

    if (!element) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const top = Math.min(
      rect.bottom + gap,
      Math.max(margin, viewportHeight - margin - 140)
    );
    const right = Math.max(margin, viewportWidth - rect.right);
    const maxHeight = Math.max(180, viewportHeight - top - margin);

    setPosition({ top, right, maxHeight });
  }, [triggerRef, gap, margin]);

  useEffect(() => {
    if (!open) {
      return;
    }

    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);

    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [open, measure]);

  return { position, measure };
}

/** Tracks whether the viewport matches a media query. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (callback: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", callback);
      return () => list.removeEventListener("change", callback);
    },
    [query]
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  );
}

/** Closes on outside pointer-down and Escape while open. */
export function useDismiss(
  open: boolean,
  refs: React.RefObject<HTMLElement | null>[],
  onDismiss: () => void
) {
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const inside = refs.some(
        (ref) => ref.current && ref.current.contains(target)
      );

      if (!inside) {
        onDismissRef.current();
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onDismissRef.current();
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}

/** Renders children into document.body (client-only). */
export function FloatingPortal({ children }: { children: React.ReactNode }) {
  const mounted = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false
  );

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(children, document.body);
}
