"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { audioTime } from "@/lib/research-audio/time";

const rates = ["0.5", "0.75", "1", "1.25", "1.5", "1.75", "2"];
const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

export default function ResearchAudioPlayer({ src, title, chapters }: {
  src: string;
  title: string;
  chapters: { title: string; startSeconds: number }[];
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const speedId = useId();
  const enhanced = useSyncExternalStore(subscribe, clientReady, serverReady);
  const pendingSeek = useRef<number | null>(null);
  const [speed, setSpeed] = useState("1");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const player = audio.current;
    const pauseOnOtherPlayback = (event: Event) => {
      if (event.target instanceof HTMLMediaElement && event.target !== audio.current) {
        audio.current?.pause();
      }
    };
    document.addEventListener("play", pauseOnOtherPlayback, true);
    return () => {
      document.removeEventListener("play", pauseOnOtherPlayback, true);
      player?.pause();
    };
  }, []);

  function seek(seconds: number) {
    const player = audio.current;
    if (!player) return;
    if (player.readyState === 0) {
      pendingSeek.current = seconds;
      player.preload = "metadata";
      player.load();
    } else {
      player.currentTime = seconds;
    }
  }

  return (
    <div className="research-audio-controls">
      <audio
        ref={audio}
        controls
        preload="none"
        aria-label={`Listen: ${title}`}
        onError={() => setFailed(true)}
        onRateChange={() => {
          if (audio.current) {
            const rate = audio.current.playbackRate;
            if (audio.current.defaultPlaybackRate !== rate) audio.current.defaultPlaybackRate = rate;
            setSpeed(String(rate));
          }
        }}
        onLoadedMetadata={() => {
          setFailed(false);
          if (audio.current) {
            audio.current.playbackRate = Number(speed);
            if (pendingSeek.current !== null) {
              audio.current.currentTime = pendingSeek.current;
              pendingSeek.current = null;
            }
          }
        }}
      >
        <source src={src} type="audio/mp4" onError={() => setFailed(true)} />
        <a href={src}>Download the audio overview</a>
      </audio>
      <div className="research-audio-speed">
        <label htmlFor={speedId}>Speed</label>
        <select id={speedId} disabled={!enhanced} value={speed} onChange={(event) => {
          setSpeed(event.target.value);
          if (audio.current) {
            audio.current.defaultPlaybackRate = Number(event.target.value);
            audio.current.playbackRate = Number(event.target.value);
          }
        }}>
          {!rates.includes(speed) && <option value={speed}>{speed}×</option>}
          {rates.map((rate) => <option key={rate} value={rate}>{rate}×</option>)}
        </select>
      </div>
      {failed && <p role="status" className="research-audio-error">The audio could not load. <a href={src}>Open the audio file</a> or read the transcript below.</p>}
      <ol className="research-audio-chapters" aria-label="Audio chapters">
        {chapters.map((chapter) => <li key={chapter.title}>
          <button type="button" disabled={!enhanced} onClick={() => seek(chapter.startSeconds)} aria-label={`Seek to ${chapter.title}`}>
            <span>{audioTime(chapter.startSeconds)}</span> {chapter.title}
          </button>
        </li>)}
      </ol>
    </div>
  );
}
