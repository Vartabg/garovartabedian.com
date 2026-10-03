"use client";

import { SPEECH_RATES, type EasyPrefs } from "@/lib/scriptures/prefs";
import {
  AUTOMATIC_SPEECH_VOICE,
  type SpeechVoiceOption,
} from "@/lib/scriptures/speech";
import type { ChapterNarration } from "@/lib/scriptures/narration";
import type { BookMeta, Canons, TranslationId } from "@/lib/scriptures/types";
import ReaderSheet from "./ReaderSheet";
import ReadingAppearance from "@/app/_components/reading/ReadingAppearance";

/**
 * Reading settings — one sheet, reachable in one tap from anywhere in the
 * chapter, holding every knob that changes how the text looks or reads.
 *
 * The old build scattered these: text size and contrast lived in a "More"
 * accordion above the text, translation and compare in a second toolbar,
 * red-letter in a third. Nothing that changes the appearance of the text
 * should be buried, and nothing should be in three places.
 */
export default function ReaderSettings({
  prefs,
  onChange,
  canons,
  meta,
  trans,
  compare,
  originalAvailable,
  showOriginal,
  onTrans,
  onCompare,
  onOriginal,
  redLetter,
  onRedLetter,
  hasRedLetter,
  canListen,
  canUseDeviceSpeech,
  narration,
  speechVoices,
  previewingVoice,
  onPreviewVoice,
  onClose,
}: {
  prefs: EasyPrefs;
  onChange: <K extends keyof EasyPrefs>(key: K, value: EasyPrefs[K]) => void;
  canons: Canons;
  meta: BookMeta;
  trans: TranslationId;
  compare: TranslationId | null;
  originalAvailable: boolean;
  showOriginal: boolean;
  onTrans: (next: TranslationId) => void;
  onCompare: (next: TranslationId | null) => void;
  onOriginal: (next: boolean) => void;
  redLetter: boolean;
  onRedLetter: (next: boolean) => void;
  hasRedLetter: boolean;
  /** Whether authored audio or this browser can read the chapter. */
  canListen: boolean;
  /** Whether browser-provided fallback voices are available. */
  canUseDeviceSpeech: boolean;
  narration: ChapterNarration | null;
  speechVoices: SpeechVoiceOption[];
  previewingVoice: boolean;
  onPreviewVoice: () => void;
  onClose: () => void;
}) {
  const multi = meta.trans.length > 1;
  const selectedVoice =
    prefs.speechVoice === AUTOMATIC_SPEECH_VOICE ||
    speechVoices.some((voice) => voice.uri === prefs.speechVoice)
      ? prefs.speechVoice
      : AUTOMATIC_SPEECH_VOICE;

  return (
    <ReaderSheet title="Reading" onClose={onClose}>
      <ReadingAppearance />

      <fieldset className="scr-set-row">
        <legend>Layout</legend>
        <div className="scr-seg" role="group">
          <button
            type="button"
            className={`scr-seg-btn${prefs.flow ? "" : " is-on"}`}
            aria-pressed={!prefs.flow}
            onClick={() => onChange("flow", false)}
          >
            One verse per line
          </button>
          <button
            type="button"
            className={`scr-seg-btn${prefs.flow ? " is-on" : ""}`}
            aria-pressed={prefs.flow}
            onClick={() => onChange("flow", true)}
          >
            Flowing paragraphs
          </button>
        </div>
        <p className="scr-set-hint">
          {showOriginal
            ? "Original-language mode aligns both texts verse by verse. Turn it off to restore flowing paragraphs."
            : "Flowing groups unchanged verses with editorial spacing. Poetry and wisdom books retain separate verse lines; comparison views stay aligned. One verse per line remains available."}
        </p>
      </fieldset>

      {narration && (
        <div className="scr-set-row">
          <p className="scr-narrator-card">
            <strong>{narration.narrator.name}</strong>
            <span>{narration.narrator.description}</span>
          </p>
          <p className="scr-set-hint">
            Authored narration is available for this translation and chapter.
          </p>
        </div>
      )}

      {canUseDeviceSpeech && (
        <fieldset className="scr-set-row">
          <legend>{narration ? "Fallback narrator" : "Narrator"}</legend>
          <div className="scr-voice-controls">
            <label className="scr-field">
              <span>Voice</span>
              <select
                value={selectedVoice}
                onChange={(event) => onChange("speechVoice", event.target.value)}
              >
                <option value={AUTOMATIC_SPEECH_VOICE}>
                  Automatic — best available
                </option>
                {speechVoices.map((voice) => (
                  <option key={voice.uri} value={voice.uri}>
                    {voice.name} · {voice.lang}
                    {voice.local ? "" : " · online"}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className={`scr-voice-preview${previewingVoice ? " is-on" : ""}`}
              onClick={onPreviewVoice}
            >
              {previewingVoice ? "Stop preview" : "Preview voice"}
            </button>
          </div>
          <p className="scr-set-hint">
            Used where authored narration is not available. Online system voices
            are marked.
          </p>
        </fieldset>
      )}

      {canListen && (
        <fieldset className="scr-set-row">
          <legend>Read-aloud speed</legend>
          <div className="scr-seg" role="group">
            {SPEECH_RATES.map((r) => (
              <button
                key={r.v}
                type="button"
                className={`scr-seg-btn${prefs.speechRate === r.v ? " is-on" : ""}`}
                aria-pressed={prefs.speechRate === r.v}
                onClick={() => onChange("speechRate", r.v)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div className="scr-set-row">
        {hasRedLetter && (
          <label className="scr-switch">
            <input
              type="checkbox"
              checked={redLetter}
              onChange={(e) => onRedLetter(e.target.checked)}
            />
            <span>Mark the words of Jesus</span>
          </label>
        )}
        {originalAvailable && (
          <label className="scr-switch">
            <input
              type="checkbox"
              checked={showOriginal}
              onChange={(event) => onOriginal(event.target.checked)}
            />
            <span>Show original-language text</span>
          </label>
        )}
      </div>

      {originalAvailable && (
        <p className="scr-set-hint scr-original-setting-hint">
          Loads one word-level Hebrew, Aramaic, or Greek chapter on demand. Tap
          a source word to inspect its lexical form and grammar.
        </p>
      )}

      {multi && (
        <div className="scr-set-row">
          <label className="scr-field">
            <span>Version</span>
            <select
              value={trans}
              onChange={(e) => onTrans(e.target.value as TranslationId)}
            >
              {meta.trans.map((t) => (
                <option key={t} value={t}>
                  {canons.translations[t]?.name ?? t}
                </option>
              ))}
            </select>
          </label>
          <label className="scr-field">
            <span>Compare with</span>
            <select
              value={compare ?? ""}
              onChange={(e) =>
                onCompare(e.target.value ? (e.target.value as TranslationId) : null)
              }
            >
              <option value="">Off</option>
              {meta.trans
                .filter((t) => t !== trans)
                .map((t) => (
                  <option key={t} value={t}>
                    {canons.translations[t]?.name ?? t}
                  </option>
                ))}
            </select>
          </label>
        </div>
      )}

      <p className="scr-set-foot">
        Choices are saved on this device. Authored chapters use pre-rendered
        audio; other chapters use voices supplied by your phone or browser. No
        paid narration API is used. Original-language mode is kept in the page
        link so it can be shared.
      </p>
    </ReaderSheet>
  );
}
