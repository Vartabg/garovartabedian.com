"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { setFindOpen, subscribeFind } from "@/lib/site/find-bridge";

const LazyFindOverlay = dynamic(() => import("./FindOverlay"), {
  ssr: false,
});

/**
 * Lightweight root-layout gate that keeps the full cross-world Find catalog,
 * query parser, and preview components out of initial page-load bundles until
 * the visitor clicks Find or presses Cmd/Ctrl+K.
 */
export default function FindOverlayGate({
  localEvidence = false,
}: {
  localEvidence?: boolean;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (mounted) return;
    return subscribeFind((next) => {
      if (next) setMounted(true);
    });
  }, [mounted]);

  useEffect(() => {
    if (mounted) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || event.altKey) return;
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") {
        return;
      }
      event.preventDefault();
      setFindOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mounted]);

  if (!mounted) return null;
  return <LazyFindOverlay localEvidence={localEvidence} />;
}
