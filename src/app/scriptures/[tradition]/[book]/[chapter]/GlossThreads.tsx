"use client";

import { useEffect, useRef } from "react";

const NS = "http://www.w3.org/2000/svg";

function motionReduced() {
  return (
    document.documentElement.dataset.a11yMotion === "reduce" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Threads: when a verse is open on a wide screen, vermilion rules run from
 * its right edge to each cross-reference in the margin, the way a scribe
 * ruled his references. Drawn as one SVG laid over the spread, re-anchored
 * on scroll and resize (the margin is sticky), drawn in over 600ms when the
 * verse changes and instantly under reduced motion. Below 1000px the margin
 * sits above the text and there is nothing to connect. The reference list is
 * a prop because the cross-reference data arrives after a verse opens: the
 * threads are drawn when the glosses exist, not when the verse was clicked.
 */
export default function GlossThreads({ openVerse, refs = [] }: { openVerse: number | null; refs?: string[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const refsKey = refs.join("\u0001");

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const spread = svg.parentElement;
    if (!spread) return;
    svg.replaceChildren();
    if (openVerse === null || !refsKey || !window.matchMedia("(min-width: 1000px)").matches) return;

    const verse = spread.querySelector<HTMLElement>(`#v${openVerse} .scr-verse`);
    const anchors = Array.from(spread.querySelectorAll<HTMLElement>(".scr-gloss-refs a"));
    if (!verse || !anchors.length) return;

    const items = anchors.map(() => {
      const path = document.createElementNS(NS, "path");
      const dot = document.createElementNS(NS, "circle");
      dot.setAttribute("r", "2.6");
      svg.append(path, dot);
      return { path, dot };
    });
    const knot = document.createElementNS(NS, "circle");
    knot.setAttribute("r", "2.2");
    knot.setAttribute("class", "gloss-thread-knot");
    svg.append(knot);

    const layout = () => {
      const box = spread.getBoundingClientRect();
      const v = verse.getBoundingClientRect();
      const x1 = v.right - box.left + 6;
      const y1 = v.top - box.top + Math.min(v.height / 2, 19);
      items.forEach((item, index) => {
        const a = anchors[index].getBoundingClientRect();
        const x2 = a.left - box.left - 8;
        const y2 = a.top - box.top + a.height / 2;
        const mx = x1 + (x2 - x1) * 0.55;
        item.path.setAttribute("d", `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`);
        item.dot.setAttribute("cx", `${x2}`);
        item.dot.setAttribute("cy", `${y2}`);
      });
      knot.setAttribute("cx", `${x1}`);
      knot.setAttribute("cy", `${y1}`);
    };
    layout();

    if (!motionReduced()) {
      items.forEach((item, index) => {
        const length = item.path.getTotalLength();
        item.path.style.strokeDasharray = `${length}`;
        item.path.style.strokeDashoffset = `${length}`;
        item.dot.style.opacity = "0";
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            item.path.style.transition = `stroke-dashoffset 620ms cubic-bezier(0.3, 0, 0.2, 1) ${index * 70}ms`;
            item.path.style.strokeDashoffset = "0";
            item.dot.style.transition = `opacity 200ms ease ${index * 70 + 500}ms`;
            item.dot.style.opacity = "1";
          }),
        );
        window.setTimeout(() => {
          item.path.style.strokeDasharray = "";
          item.path.style.strokeDashoffset = "";
          item.path.style.transition = "";
        }, 1500 + index * 70);
      });
    }

    let frame = 0;
    const relayout = () => {
      if (!frame)
        frame = requestAnimationFrame(() => {
          frame = 0;
          layout();
        });
    };
    window.addEventListener("scroll", relayout, { passive: true });
    window.addEventListener("resize", relayout, { passive: true });
    const observer = "ResizeObserver" in window ? new ResizeObserver(relayout) : null;
    observer?.observe(spread);
    return () => {
      window.removeEventListener("scroll", relayout);
      window.removeEventListener("resize", relayout);
      observer?.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [openVerse, refsKey]);

  return <svg ref={svgRef} className="gloss-threads" aria-hidden="true" focusable="false" />;
}
