"use client";

import { useCallback, useEffect, useRef } from "react";

export interface SemanticRequestHandle {
  signal: AbortSignal;
  current: () => boolean;
}

/**
 * Manages an in-flight semantic request lifecycle.
 *
 * begin() aborts any previous request, stores a fresh AbortController, and
 * returns its signal plus a current() guard that stays true only while that
 * exact controller is still the active one and has not been aborted.
 * cancel() invalidates the active controller then aborts it. Unmount runs
 * cancel() via an effect cleanup, so StrictMode cleanup/setup replays are
 * safe: no mounted flag is needed because consumer effects and event
 * handlers own begin() calls.
 */
export function useSemanticRequest(): {
  begin: () => SemanticRequestHandle;
  cancel: () => void;
} {
  const controllerRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    const active = controllerRef.current;
    controllerRef.current = null;
    if (active) {
      active.abort();
    }
  }, []);

  const begin = useCallback((): SemanticRequestHandle => {
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    const controller = new AbortController();
    controllerRef.current = controller;
    return {
      signal: controller.signal,
      current: () =>
        controllerRef.current === controller && !controller.signal.aborted,
    };
  }, []);

  useEffect(() => cancel, [cancel]);

  return { begin, cancel };
}

export default useSemanticRequest;
