"use client";

import { useEffect } from "react";
import { openDisclosureForHash } from "@/lib/world-disclosure";

/**
 *Tiny client island for Server Component rooms with `<details id="...">`
 * records so `#hash` links from Find open and scroll to the target disclosure.
 */
export default function HashDisclosureOpener() {
  useEffect(() => {
    let frame = 0;

    const syncHash = () => {
      const target = openDisclosureForHash(window.location.hash, document);
      if (!target) return;
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        target.scrollIntoView({ block: "start" });
      });
    };

    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", syncHash);
    };
  }, []);

  return null;
}
