"use client";

import { useEffect, useState, type ComponentType } from "react";
import type { DoorwaysStart } from "../../../_components/doorways/Doorways";
import ReaderSheet from "./ReaderSheet";

type PickerBody = ComponentType<{ start: DoorwaysStart; onNavigate: () => void }>;

let loaded: PickerBody | null = null;
let loading: Promise<PickerBody> | null = null;

function loadPicker(): Promise<PickerBody> {
  loading ??= import("../../../_components/doorways/ReaderDoorways").then(
    (module) => (loaded = module.default),
    (error: unknown) => {
      loading = null; // the next open tries again
      throw error;
    },
  );
  return loading;
}

/** Fetch the picker and its book data ahead of the tap, so the sheet opens full. */
export function preloadChapterPicker() {
  loadPicker().catch(() => {
    // A failed preload is retried when the sheet opens.
  });
}

/**
 * Go anywhere, in one sheet: the same picker as the Scripture page, opened
 * at the chapter being read, in the view the reader last used.
 *
 * It replaces a chapter grid and a plain book list, which had replaced four
 * navigators stacked above the text.
 *
 * Once loaded, the picker renders directly rather than through Suspense.
 * React holds a just-shown fallback for 300ms (FALLBACK_THROTTLE_MS), which
 * made a preloaded sheet take about 300ms to fill instead of one frame.
 */
export default function ChapterPicker({ start, onClose }: { start: DoorwaysStart; onClose: () => void }) {
  const [Body, setBody] = useState<PickerBody | null>(() => loaded);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (Body) return;
    let live = true;
    loadPicker().then(
      (component) => live && setBody(() => component),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, [Body]);

  return (
    <ReaderSheet title="Go to" wide onClose={onClose}>
      {Body ? (
        <Body start={start} onNavigate={onClose} />
      ) : (
        <p className="dw-hint" role="status">
          {failed ? "The book list didn’t load. Close this and try again." : "Loading the books…"}
        </p>
      )}
    </ReaderSheet>
  );
}
