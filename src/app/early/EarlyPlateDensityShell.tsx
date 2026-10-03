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
      <p className="scr-meta ew-plate-density" aria-live="polite">
        {density === "sparse" ? (
          <>
            Showing a lighter set of chapter illustrations ({platedCount} available)
            so this long text stays readable.{" "}
            <button
              type="button"
              className="textlink ew-plate-density-btn"
              onClick={() => setDensity("full")}
            >
              Show every illustration
            </button>
          </>
        ) : (
          <>
            Showing all {platedCount} chapter illustrations.{" "}
            <button
              type="button"
              className="textlink ew-plate-density-btn"
              onClick={() => setDensity("sparse")}
            >
              Use lighter set
            </button>
          </>
        )}
      </p>
      {children}
    </div>
  );
}
