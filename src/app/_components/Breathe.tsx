"use client";

import { useEffect, useRef } from "react";

function motionReduced() {
  return (
    document.documentElement.dataset.a11yMotion === "reduce" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Letters that breathe. Fraunces is a variable font; four of its axes are set
 * per letter, per frame, from the distance to the pointer — the ink pools
 * where the hand is and settles when it leaves. Left alone the letters breathe
 * slowly. The letters are real inline text — one source in the DOM, read once
 * by screen readers, crawlers, reading modes, and copy/paste alike. They are
 * plain inline spans: `display: inline-block` would make some screen readers
 * spell the title out letter by letter. Under reduced motion the letters are
 * still.
 */
export default function Breathe({ text, className = "" }: { text: string; className?: string }) {
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || motionReduced()) return;
    const stage = root.closest<HTMLElement>("h1, h2, .st-front, .world-home-hero-copy") ?? root;
    const letters = Array.from(root.querySelectorAll<HTMLElement>("[data-letter]"));
    if (!letters.length) return;

    let pointer: { x: number; y: number } | null = null;
    let frame = 0;
    let visible = false;
    const start = performance.now();

    const paint = (now: number) => {
      frame = 0;
      letters.forEach((letter, index) => {
        let t: number;
        if (pointer) {
          const box = letter.getBoundingClientRect();
          const distance = Math.hypot(box.left + box.width / 2 - pointer.x, box.top + box.height / 2 - pointer.y);
          t = Math.max(0, 1 - distance / 220);
        } else {
          t = 0.16 + 0.16 * Math.sin((now - start) / 1100 + index * 0.55);
        }
        const soft = 40 + 60 * t;
        const weight = 500 + 180 * t;
        const optical = 48 - 20 * t;
        letter.style.fontVariationSettings = `"opsz" ${optical.toFixed(0)}, "SOFT" ${soft.toFixed(0)}, "WONK" 1, "wght" ${weight.toFixed(0)}`;
      });
      if (visible) frame = requestAnimationFrame(paint);
    };
    const wake = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const onMove = (event: PointerEvent) => {
      pointer = { x: event.clientX, y: event.clientY };
      wake();
    };
    const onLeave = () => {
      pointer = null;
      wake();
    };
    stage.addEventListener("pointermove", onMove, { passive: true });
    stage.addEventListener("pointerleave", onLeave);
    const io = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      if (visible) wake();
    });
    io.observe(root);

    return () => {
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
      io.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [text]);

  return (
    <span ref={rootRef} className={`breathe ${className}`.trim()}>
      {Array.from(text).map((character, index) =>
        character === " " ? (
          <span key={index}> </span>
        ) : (
          <span key={index} data-letter="">
            {character}
          </span>
        ),
      )}
    </span>
  );
}
