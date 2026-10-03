"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { openDisclosureForHash } from "@/lib/world-disclosure";

export default function WorldDisclosure({
  children,
  id,
  label,
  note,
  variant = "more",
}: {
  children: ReactNode;
  id?: string;
  label: string;
  note: string;
  variant?: "deep" | "more";
}) {
  const detailsRef = useRef<HTMLDetailsElement | null>(null);

  useEffect(() => {
    let frame = 0;

    const openTarget = () => {
      const target = openDisclosureForHash(window.location.hash, document);
      if (!target || !detailsRef.current?.contains(target)) return;

      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        target.scrollIntoView({ block: "start" });
      });
    };

    openTarget();
    window.addEventListener("hashchange", openTarget);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", openTarget);
    };
  }, []);

  return (
    <details
      ref={detailsRef}
      id={id}
      className={`world-disclosure world-disclosure--${variant}`}
      suppressHydrationWarning
    >
      <summary>
        <strong>{label}</strong>
        <span>{note}</span>
      </summary>
      <div className="world-disclosure-content">{children}</div>
    </details>
  );
}
