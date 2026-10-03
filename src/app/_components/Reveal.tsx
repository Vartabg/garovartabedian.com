"use client";

import type { ReactNode } from "react";
import { useReveal } from "@/hooks/useReveal";

/** Minimal client boundary for revealing server-rendered descendants on scroll. */
export default function Reveal({ children }: { children: ReactNode }) {
  const rootRef = useReveal<HTMLDivElement>();

  return (
    <div className="story" ref={rootRef}>
      {children}
    </div>
  );
}
