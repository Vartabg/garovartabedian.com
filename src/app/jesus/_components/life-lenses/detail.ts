"use client";

import { useEffect, useState } from "react";
import type { LifeLensesDetail } from "@/lib/jesus/life-lenses";

const DETAIL_URL = "/jesus/life-lenses-detail.json";

let loaded: LifeLensesDetail | null = null;
let loading: Promise<LifeLensesDetail> | null = null;

/** What every lens shows, fetched once and shared by every moment. */
export function loadLifeDetail(): Promise<LifeLensesDetail> {
  loading ??= fetch(DETAIL_URL)
    .then((response) => {
      if (!response.ok) throw new Error(`${DETAIL_URL}: ${response.status}`);
      return response.json() as Promise<LifeLensesDetail>;
    })
    .then(
      (detail) => (loaded = detail),
      (error: unknown) => {
        loading = null; // the next request tries again
        throw error;
      },
    );
  return loading;
}

/**
 * The detail file, once loaded. It is requested when the page is idle, so by
 * the time someone chooses a moment the lenses can fill without waiting.
 */
export function useLifeDetail(wanted: boolean) {
  const [detail, setDetail] = useState<LifeLensesDetail | null>(() => loaded);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (detail) return;
    let live = true;
    const start = () =>
      loadLifeDetail().then(
        (value) => live && setDetail(value),
        () => live && setFailed(true),
      );
    if (wanted) {
      start();
      return () => {
        live = false;
      };
    }
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(start, { timeout: 4000 })
      : window.setTimeout(start, 2500);
    return () => {
      live = false;
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, [detail, wanted, attempt]);

  const retry = () => {
    setFailed(false);
    setAttempt((n) => n + 1);
  };
  return { detail, failed, retry };
}
