"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Headings that write themselves in as they come into view. */
const TARGETS = [
  ".st-front-title",
  ".st-scripture-heading h2",
  ".st-worlds-heading h2",
  "#paths-h",
  ".world-home-hero h1",
  ".world-home-hero-eyebrow",
  ".scr-rubric",
  ".scr-read-after-h",
  ".scr-rh-title",
].join(", ");

function motionReduced() {
  return (
    document.documentElement.dataset.a11yMotion === "reduce" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * The pen writes: a heading entering the viewport is revealed left to right
 * (core.css `.write-in`, a clip-path animation). Headings already on screen
 * when the page settles are left alone, so nothing that was readable flickers.
 * Renders nothing; runs once per route.
 */
export default function PenWrites() {
  const pathname = usePathname();

  useEffect(() => {
    if (motionReduced() || !("IntersectionObserver" in window)) return;
    const heads = Array.from(document.querySelectorAll<HTMLElement>(TARGETS));
    if (!heads.length) return;
    const viewport = window.innerHeight;
    const pending = heads.filter((head) => {
      const box = head.getBoundingClientRect();
      const onScreen = box.bottom > 0 && box.top < viewport;
      return !onScreen && !head.classList.contains("write-in");
    });
    if (!pending.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const head = entry.target as HTMLElement;
          head.classList.add("write-in");
          // Once written, the heading is an ordinary heading again: nothing
          // stays clipped (a versal's vines, for one, reach past the box).
          head.addEventListener(
            "animationend",
            () => {
              head.classList.remove("write-in");
              head.dataset.written = "true";
            },
            { once: true },
          );
          io.unobserve(head);
        }
      },
      { threshold: 0.15 },
    );
    pending.forEach((head) => io.observe(head));
    return () => io.disconnect();
  }, [pathname]);

  return null;
}
