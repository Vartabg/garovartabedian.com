"use client";

import { useEffect, useState } from "react";
import { buttonClassName } from "@/app/_components/Button";
import { OFFLINE_READER_URL, saveOfflineChapter, type OfflineChapter } from "@/lib/scriptures/offline";

type Props = Omit<OfflineChapter, "version" | "savedAt" | "verses"> & { verses: string[] | null };

export default function SaveOffline({ verses, ...chapter }: Props) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const readerUrl = new URL(OFFLINE_READER_URL, window.location.href);
    const skipReaderTransition = (event: PageSwapEvent) => {
      const transition = event.viewTransition;
      const destination = event.activation?.entry.url;
      if (!transition || !destination) return;
      const destinationUrl = new URL(destination, window.location.href);
      if (destinationUrl.origin !== readerUrl.origin || destinationUrl.pathname !== readerUrl.pathname) return;

      // The standalone reader does not opt into document transitions. Skip
      // before handing it a snapshot, and handle this intentional rejection.
      void transition.ready.catch(() => {});
      transition.skipTransition();
    };
    window.addEventListener("pageswap", skipReaderTransition);
    return () => window.removeEventListener("pageswap", skipReaderTransition);
  }, []);

  async function save() {
    if (!verses || busy) return;
    setBusy(true);
    setStatus("Preparing the offline reader and saving this chapter…");
    try {
      await saveOfflineChapter({ ...chapter, verses, version: 1, savedAt: new Date().toISOString() });
      setStatus(`${chapter.bookName} ${chapter.chapter} saved for offline reading.`);
    } catch {
      setStatus("Could not save this chapter. Check your connection and available browser storage, then try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="scr-offline-save">
      <button type="button" className={buttonClassName({ variant: "ghost", size: "sm" })}
        disabled={!verses || busy} aria-busy={busy} onClick={save}>Save chapter offline</button>
      {" "}<a href={OFFLINE_READER_URL}>Open saved chapters</a>
      <p className="note" role="status" aria-live="polite" aria-atomic="true">{status}</p>
    </div>
  );
}
