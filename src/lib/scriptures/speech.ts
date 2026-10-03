/** Zero-cost Scripture narration built on voices supplied by the reader's device. */

export const AUTOMATIC_SPEECH_VOICE = "auto";

export type SpeechVoiceData = {
  default: boolean;
  lang: string;
  localService: boolean;
  name: string;
  voiceURI: string;
};

export type SpeechVoiceOption = {
  uri: string;
  name: string;
  lang: string;
  local: boolean;
};

export type SpeechSegment = {
  text: string;
  pauseAfterMs: number;
};

export type SpeechPlayback = {
  cancel: () => void;
};

const GOOD_VOICE_NAMES = [
  "natural",
  "neural",
  "premium",
  "enhanced",
  "siri",
  "ava",
  "samantha",
  "serena",
  "daniel",
  "moira",
  "karen",
  "tessa",
  "allison",
  "alex",
  "aria",
  "jenny",
  "sonia",
  "ryan",
  "google us english",
  "google uk english female",
];

const NOVELTY_VOICE_NAMES = [
  "albert",
  "bad news",
  "bahh",
  "bells",
  "boing",
  "bubbles",
  "cellos",
  "deranged",
  "fred",
  "good news",
  "hysterical",
  "pipe organ",
  "superstar",
  "trinoids",
  "whisper",
  "wobble",
  "zarvox",
];

const isEnglishVoice = (voice: SpeechVoiceData) => /^en(?:[-_]|$)/i.test(voice.lang);

/** Rank natural device voices ahead of novelty and generic fallback voices. */
export function speechVoiceScore(voice: SpeechVoiceData): number {
  if (!isEnglishVoice(voice)) return -10_000;

  const name = voice.name.toLowerCase();
  let score = 0;

  if (voice.localService) score += 180;
  if (voice.default) score += 40;
  if (/^en[-_]us$/i.test(voice.lang)) score += 35;
  else if (/^en[-_]gb$/i.test(voice.lang)) score += 25;

  const preferredIndex = GOOD_VOICE_NAMES.findIndex((part) => name.includes(part));
  if (preferredIndex >= 0) score += 650 - preferredIndex * 12;

  if (name.includes("microsoft") || name.includes("google") || name.includes("apple"))
    score += 80;

  if (NOVELTY_VOICE_NAMES.some((part) => name.includes(part))) score -= 2_000;

  return score;
}

/** English voices in the order they should appear in the reader settings. */
export function speechVoiceOptions(
  voices: readonly SpeechVoiceData[],
): SpeechVoiceOption[] {
  const seen = new Set<string>();
  return [...voices]
    .filter(isEnglishVoice)
    .sort(
      (a, b) =>
        speechVoiceScore(b) - speechVoiceScore(a) ||
        a.name.localeCompare(b.name) ||
        a.lang.localeCompare(b.lang),
    )
    .filter((voice) => {
      if (seen.has(voice.voiceURI)) return false;
      seen.add(voice.voiceURI);
      return true;
    })
    .map((voice) => ({
      uri: voice.voiceURI,
      name: voice.name,
      lang: voice.lang,
      local: voice.localService,
    }));
}

/** Honor a saved voice when it still exists, otherwise choose the best voice. */
export function resolveSpeechVoice<T extends SpeechVoiceData>(
  voices: readonly T[],
  preferredURI: string,
): T | null {
  const english = voices.filter(isEnglishVoice);
  if (preferredURI !== AUTOMATIC_SPEECH_VOICE) {
    const preferred = english.find((voice) => voice.voiceURI === preferredURI);
    if (preferred) return preferred;
  }
  return (
    [...english].sort(
      (a, b) =>
        speechVoiceScore(b) - speechVoiceScore(a) ||
        a.name.localeCompare(b.name),
    )[0] ?? null
  );
}

function splitLongPassage(text: string, maxChars: number): string[] {
  const clean = text.trim();
  if (!clean || clean.length <= maxChars) return clean ? [clean] : [];

  const sentences = clean.match(/[^.!?…]+[.!?…]+[”’"')\]]*|[^.!?…]+$/g) ?? [clean];
  const pieces: string[] = [];

  for (const sentence of sentences.map((part) => part.trim()).filter(Boolean)) {
    if (sentence.length <= maxChars) {
      pieces.push(sentence);
      continue;
    }

    let rest = sentence;
    while (rest.length > maxChars) {
      const comma = rest.lastIndexOf(",", maxChars);
      const space = rest.lastIndexOf(" ", maxChars);
      const cut = comma > maxChars * 0.55 ? comma + 1 : Math.max(space, 1);
      pieces.push(rest.slice(0, cut).trim());
      rest = rest.slice(cut).trim();
    }
    if (rest) pieces.push(rest);
  }

  return pieces;
}

/**
 * Build short, natural speech chunks. Short chunks avoid the long-utterance
 * stalls common in browser speech engines while preserving sentence cadence.
 */
export function buildChapterSpeechSegments(
  bookName: string,
  chapter: number,
  verses: readonly string[],
  maxChars = 360,
): SpeechSegment[] {
  const segments: SpeechSegment[] = [
    { text: `${bookName}, chapter ${chapter}.`, pauseAfterMs: 320 },
  ];
  let current = "";

  const flush = () => {
    if (!current) return;
    segments.push({ text: current, pauseAfterMs: 180 });
    current = "";
  };

  for (const verse of verses) {
    for (const piece of splitLongPassage(verse, maxChars)) {
      const joined = current ? `${current} ${piece}` : piece;
      if (current && joined.length > maxChars) {
        flush();
        current = piece;
      } else {
        current = joined;
      }
    }
  }
  flush();

  return segments;
}

export function buildVerseSpeechSegments(
  bookName: string,
  chapter: number,
  verse: number,
  text: string,
): SpeechSegment[] {
  return [
    {
      text: `${bookName} ${chapter}, verse ${verse}.`,
      pauseAfterMs: 180,
    },
    ...splitLongPassage(text, 360).map((part) => ({
      text: part,
      pauseAfterMs: 0,
    })),
  ];
}

let activePlayback: SpeechPlayback | null = null;

/** Map the existing reader speed choices around authored audio's natural 1×. */
export function narratedAudioRate(speechRate: number): number {
  return Math.min(1.3, Math.max(0.75, speechRate / 0.9));
}

/**
 * Play authored narration while sharing the same stop/start coordination as
 * browser speech. This keeps chapter audio and verse tools from talking over
 * one another.
 */
export function startNarratedAudioPlayback({
  src,
  rate,
  onEnd,
  onStop,
  onError,
}: {
  src: string;
  rate: number;
  onEnd?: () => void;
  onStop?: () => void;
  onError?: () => void;
}): SpeechPlayback | null {
  if (typeof window === "undefined" || typeof Audio === "undefined") return null;

  activePlayback?.cancel();

  const audio = new Audio(src);
  audio.preload = "auto";
  audio.playbackRate = narratedAudioRate(rate);
  let active = true;

  const clearActive = () => {
    if (activePlayback === playback) activePlayback = null;
  };
  const cleanup = () => {
    audio.removeEventListener("ended", finish);
    audio.removeEventListener("error", fail);
  };
  const finish = () => {
    if (!active) return;
    active = false;
    cleanup();
    clearActive();
    onEnd?.();
  };
  const fail = () => {
    if (!active) return;
    active = false;
    cleanup();
    clearActive();
    audio.pause();
    onError?.();
  };
  const playback: SpeechPlayback = {
    cancel: () => {
      if (!active) return;
      active = false;
      cleanup();
      clearActive();
      audio.pause();
      try {
        audio.currentTime = 0;
      } catch {
        // Some browsers reject seeking before metadata has loaded.
      }
      onStop?.();
    },
  };

  audio.addEventListener("ended", finish);
  audio.addEventListener("error", fail);
  activePlayback = playback;
  void audio.play().catch(fail);
  return playback;
}

/**
 * Speak one segment at a time so punctuation and passage boundaries have room.
 * Starting a new reading stops the previous one across chapter and verse tools.
 */
export function startSpeechPlayback({
  segments,
  voiceURI,
  rate,
  onEnd,
  onStop,
  onError,
}: {
  segments: readonly SpeechSegment[];
  voiceURI: string;
  rate: number;
  onEnd?: () => void;
  onStop?: () => void;
  onError?: () => void;
}): SpeechPlayback | null {
  if (
    typeof window === "undefined" ||
    !("speechSynthesis" in window) ||
    typeof SpeechSynthesisUtterance === "undefined"
  )
    return null;

  activePlayback?.cancel();

  const synth = window.speechSynthesis;
  const voice = resolveSpeechVoice(synth.getVoices(), voiceURI);
  const usableSegments = segments.filter((segment) => segment.text.trim());
  let active = true;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const clearActive = () => {
    if (activePlayback === playback) activePlayback = null;
  };

  const finish = () => {
    if (!active) return;
    active = false;
    clearActive();
    onEnd?.();
  };

  const fail = () => {
    if (!active) return;
    active = false;
    clearActive();
    onError?.();
  };

  const speakAt = (index: number) => {
    if (!active) return;
    const segment = usableSegments[index];
    if (!segment) {
      finish();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(segment.text);
    utterance.lang = voice?.lang ?? "en-US";
    utterance.rate = Math.min(1.4, Math.max(0.6, rate));
    utterance.pitch = 1;
    if (voice) utterance.voice = voice as SpeechSynthesisVoice;
    utterance.onend = () => {
      if (!active) return;
      if (segment.pauseAfterMs > 0) {
        timer = setTimeout(() => speakAt(index + 1), segment.pauseAfterMs);
      } else {
        speakAt(index + 1);
      }
    };
    utterance.onerror = fail;
    synth.speak(utterance);
  };

  const playback: SpeechPlayback = {
    cancel: () => {
      if (!active) return;
      active = false;
      if (timer) clearTimeout(timer);
      clearActive();
      synth.cancel();
      onStop?.();
    },
  };
  activePlayback = playback;

  synth.cancel();
  speakAt(0);
  return playback;
}
