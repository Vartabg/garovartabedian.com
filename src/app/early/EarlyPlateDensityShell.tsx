"use client";

import { useState, type ReactNode } from "react";
import type { PlateDensity } from "@/lib/early/plate-density";

export default function EarlyPlateDensityShell({
  platedCount,
  children,
}: {
  platedCount: number;
  children: ReactNode;
}) {
  const [density, setDensity] = useState<PlateDensity>("sparse");

  return (
    <div className="ew-density-shell" data-density={density}>
      {/* One line, not a paragraph about illustrations above the first
          sentence: the button says what it does. */}
      <p className="scr-meta ew-plate-density" aria-live="polite">
        <button
          type="button"
          className="textlink ew-plate-density-btn"
          onClick={() => setDensity(density === "sparse" ? "full" : "sparse")}
        >
          {density === "sparse"
            ? `Show all ${platedCount} illustrations`
            : "Show fewer illustrations"}
        </button>
      </p>
      {children}
    </div>
  );
}
