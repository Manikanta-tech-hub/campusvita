"use client";

import { useCallback, useEffect, useState } from "react";

import {
  fetchDiscoveredStalls,
  type DiscoveredStall,
} from "@/app/lib/stallDiscovery";

/* =========================================================
   useStallDiscovery
   Shared stall catalog loader for the homepage discovery
   section and the /stalls page.

   - Fetches GET /stalls once, then enriches each stall with
     its real menu data (rating, prep time, categories, veg).
   - Results are cached in the module-level cache inside
     stallDiscovery.ts, so navigating between / and /stalls
     does not refetch.
   - Individual menu failures degrade gracefully: the stall
     stays visible with unsupported metadata hidden.
========================================================= */

type State = {
  stalls: DiscoveredStall[];
  loading: boolean;
  error: string | null;
};

const LOAD_ERROR =
  "We couldn't load the campus stalls right now. Please try again.";

export default function useStallDiscovery(options: {
  enrich?: boolean;
} = {}) {
  const { enrich = true } = options;

  const [state, setState] = useState<State>({
    stalls: [],
    loading: true,
    error: null,
  });

  /* Bumped by retry() to force a fresh fetch past the cache */
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const stalls = await fetchDiscoveredStalls({
          enrich,
          force: reloadToken > 0,
        });

        if (!cancelled) {
          setState({ stalls, loading: false, error: null });
        }
      } catch {
        if (!cancelled) {
          setState({ stalls: [], loading: false, error: LOAD_ERROR });
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [enrich, reloadToken]);

  const retry = useCallback(() => {
    setState((previous) => ({ ...previous, loading: true, error: null }));
    setReloadToken((token) => token + 1);
  }, []);

  return {
    stalls: state.stalls,
    loading: state.loading,
    error: state.error,
    retry,
  };
}
