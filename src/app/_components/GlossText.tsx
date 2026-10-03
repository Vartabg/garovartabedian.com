"use client";

import { segmentText, type GlossSeen } from "@/lib/glossary/segment";
import { GlossSegments } from "./Gloss";

/**
 * Client-side convenience for pages that fetch their prose at runtime:
 * matches glossary terms in one string and renders them tappable.
 * Server components should call segmentText themselves (sharing one `seen`
 * map across the page) and render <GlossSegments> — that keeps the full
 * glossary out of the client bundle.
 */
export default function GlossText({
  text,
  seen,
}: {
  text: string;
  seen?: GlossSeen;
}) {
  return <GlossSegments segments={segmentText(text, seen)} />;
}
