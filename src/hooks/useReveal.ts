"use client";

import { useEffect, useRef } from "react";

/**
 * Scroll-reveal fallback: where CSS view timelines are unsupported, any
 * descendant with class `reveal` fades/rises in via IntersectionObserver
 * when it scrolls into view (and is left visible if that is missing too).
 * Modern browsers drive .reveal from core.css's st-reveal-in view timeline
 * instead; this hook then only re-asserts the visible end state.
 * Returns a ref to attach to the container.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const rootRef = useRef<T>(null);

  useEffect(() => {
    const els = rootRef.current?.querySelectorAll(".reveal");
    if (!els || !("IntersectionObserver" in window)) {
      els?.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return rootRef;
}
