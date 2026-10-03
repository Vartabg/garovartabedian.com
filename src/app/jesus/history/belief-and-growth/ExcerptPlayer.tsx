"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { excerptEmbedUrl, excerptWatchUrl, timestamp, type VideoExcerpt } from "@/lib/site/excerpt-video";

type ActiveExcerpt = { id: string; sequence: number } | null;
const PlaybackContext = createContext<{
  active: ActiveExcerpt;
  play: (id: string) => void;
  close: () => void;
} | null>(null);

/** One player at a time, with the essay itself rendered by the server. */
export function ExcerptPlayback({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActiveExcerpt>(null);
  return (
    <PlaybackContext.Provider value={{
      active,
      play: (id) => setActive((previous) => ({ id, sequence: (previous?.sequence ?? 0) + 1 })),
      close: () => setActive(null),
    }}>
      {children}
    </PlaybackContext.Provider>
  );
}

export default function ExcerptPlayer({ clip }: { clip: VideoExcerpt }) {
  const playback = useContext(PlaybackContext);
  const watchButton = useRef<HTMLButtonElement>(null);
  if (!playback) throw new Error("ExcerptPlayer requires ExcerptPlayback.");
  const isOpen = playback.active?.id === clip.id;
  const panelId = `excerpt-${clip.id}`;

  return (
    <figure className="diamond-excerpt">
      <figcaption className="diamond-excerpt-caption">
        <span>Jared Diamond · JRE #2549</span>
        <a href={excerptWatchUrl(clip.start)} target="_blank" rel="noopener noreferrer">
          <span className="sr-only">Open this excerpt on YouTube, </span>
          {timestamp(clip.start)}–{timestamp(clip.end)}
        </a>
      </figcaption>
      <blockquote><p>“{clip.quote}”</p></blockquote>
      <div className="diamond-excerpt-actions">
        <button
          ref={watchButton}
          type="button"
          className="diamond-watch"
          aria-expanded={isOpen}
          aria-controls={panelId}
          aria-label={`${isOpen ? "Replay" : "Watch"} excerpt: ${clip.title}`}
          onClick={() => playback.play(clip.id)}
        >
          <span aria-hidden="true">▶</span>
          {isOpen ? "Replay excerpt" : "Watch excerpt"}
          <span className="diamond-duration">{timestamp(clip.end - clip.start)}</span>
        </button>
        <a className="diamond-source-link" href={excerptWatchUrl(clip.start)} target="_blank" rel="noopener noreferrer">
          Open on YouTube <span aria-hidden="true">↗</span>
          <span className="sr-only"> at {timestamp(clip.start)}</span>
        </a>
      </div>
      <div id={panelId} hidden={!isOpen}>
        {isOpen && (
          <>
            <div className="diamond-player">
              <iframe
                key={playback.active?.sequence}
                src={excerptEmbedUrl(clip.start, clip.end)}
                title={`Jared Diamond: ${clip.title} (${timestamp(clip.start)}–${timestamp(clip.end)})`}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
            <div className="diamond-player-help">
              <p>Player not loading? Use “Open on YouTube” above to reach the same moment.</p>
              <button type="button" onClick={() => {
                playback.close();
                watchButton.current?.focus();
              }}>Close player</button>
            </div>
          </>
        )}
      </div>
    </figure>
  );
}
