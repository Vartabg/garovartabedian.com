"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Prose around maps, timelines and evidence tools shares the reader contract.
 * Dedicated readers own their own surface; no empty Trace controls are added.
 * The /jesus landing is a tool, not prose, so it keeps its own type. */
export default function ReadingNarrative({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname.includes("/stories/") || pathname === "/jesus/history/belief-and-growth" || pathname === "/jesus") {
    return children;
  }
  return <div className="reading-narrative" data-reading-surface data-reading-mode="read">{children}</div>;
}
