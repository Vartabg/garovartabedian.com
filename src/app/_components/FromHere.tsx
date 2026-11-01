"use client";

import { useEffect, useSyncExternalStore } from "react";
import { setFromHere, type FromHereLink } from "@/lib/site/from-here";

const subscribeNever = () => () => {};

/**
 * Hands this page's next steps to the site menu. One per page: the store
 * holds a single page's links. Once hydrated it also renders a hidden marker
 * so the stylesheet drops the world's generic "Continue exploring" links,
 * which repeat the menu. The marker waits for the script on purpose: without
 * JavaScript the menu has no From here, so those links stay.
 */
export default function FromHere({ label, links }: { label: string; links: FromHereLink[] }) {
  // A string key keeps the effect from re-running on every render of a
  // parent that rebuilds the links array.
  const key = JSON.stringify({ label, links });
  // False on the server and during hydration, true afterwards.
  const hydrated = useSyncExternalStore(subscribeNever, () => true, () => false);
  useEffect(() => {
    const value = JSON.parse(key) as { label: string; links: FromHereLink[] };
    setFromHere(value.links.length ? value : null);
    return () => setFromHere(null);
  }, [key]);
  return hydrated && links.length ? <span data-from-here hidden /> : null;
}
