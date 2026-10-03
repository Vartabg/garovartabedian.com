"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Prose around maps, timelines and evidence tools shares the reader contract.
 * Dedicated readers own their own surface; no empty Trace controls are added. */
export default function ReadingNarrative({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname.includes("/stories/") || pathname === "/jesus/history/belief-and-growth") return children;
  return <div className="reading-narrative" data-reading-surface data-reading-mode="read">{children}</div>;
}
