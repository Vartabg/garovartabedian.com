import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AUTOMATIC_SPEECH_VOICE,
  buildChapterSpeechSegments,
  buildVerseSpeechSegments,
  narratedAudioRate,
  resolveSpeechVoice,
  speechVoiceOptions,
  type SpeechVoiceData,
} from "../src/lib/scriptures/speech";
import { getChapterNarration } from "../src/lib/scriptures/narration";

const voice = (
  name: string,
  overrides: Partial<SpeechVoiceData> = {},
): SpeechVoiceData => ({
  default: false,
  lang: "en-US",
  localService: true,
  name,
  voiceURI: `voice:${name}`,
  ...overrides,
});

describe("Scripture speech", () => {
  it("reads chapter text without announcing every verse number", () => {
    const verses = [
      "Yahweh is my shepherd; I shall lack nothing.",
      "He makes me lie down in green pastures.",
      "He restores my soul.",
    ];
    const segments = buildChapterSpeechSegments("Psalms", 23, verses, 70);

    assert.equal(segments[0]?.text, "Psalms, chapter 23.");
    assert.equal(
      segments
        .slice(1)
        .map((segment) => segment.text)
        .join(" "),
      verses.join(" "),
    );
    assert.ok(segments.every((segment) => !/\bverse \d+/i.test(segment.text)));
    assert.ok(segments.slice(1).every((segment) => segment.text.length <= 70));
  });

  it("keeps the reference when a reader requests one verse", () => {
    const segments = buildVerseSpeechSegments(
      "John",
      3,
      16,
      "For God so loved the world.",
    );

    assert.equal(segments[0]?.text, "John 3, verse 16.");
    assert.equal(segments[1]?.text, "For God so loved the world.");
  });

  it("prefers a natural local voice and rejects novelty voices", () => {
    const voices = [
      voice("Fred", { default: true }),
      voice("Basic English"),
      voice("Microsoft Jenny Online (Natural)", { localService: false }),
      voice("Ava (Enhanced)"),
      voice("Amelie", { lang: "fr-FR" }),
    ];

    const options = speechVoiceOptions(voices);
    assert.equal(options[0]?.name, "Ava (Enhanced)");
    assert.equal(options.at(-1)?.name, "Fred");
    assert.ok(options.every((option) => option.lang.startsWith("en")));
    assert.equal(
      resolveSpeechVoice(voices, AUTOMATIC_SPEECH_VOICE)?.name,
      "Ava (Enhanced)",
    );
  });

  it("honors a saved English voice when it is still available", () => {
    const voices = [voice("Ava (Enhanced)"), voice("Daniel")];

    assert.equal(resolveSpeechVoice(voices, "voice:Daniel")?.name, "Daniel");
    assert.equal(
      resolveSpeechVoice(voices, "voice:No longer installed")?.name,
      "Ava (Enhanced)",
    );
  });

  it("finds authored narration only for an exact translation and chapter", () => {
    const kjv = getChapterNarration("kjv", "PSA", 23);
    const landingChapters = [
      ["PSA", 23],
      ["GEN", 1],
      ["MAT", 1],
      ["ROM", 8],
      ["PRO", 1],
    ] as const;

    assert.equal(kjv?.narrator.name, "The Elder");
    assert.equal(kjv?.src, "/scriptures/audio/kjv/PSA/23.m4a");
    for (const [book, chapter] of landingChapters) {
      assert.equal(
        getChapterNarration("web", book, chapter)?.src,
        `/scriptures/audio/web/${book}/${chapter}.m4a`,
      );
    }
    assert.equal(getChapterNarration("drb", "PSA", 23), null);
    assert.equal(getChapterNarration("kjv", "PSA", 24), null);
  });

  it("treats the existing normal speed as natural authored playback", () => {
    assert.equal(narratedAudioRate(0.9), 1);
    assert.equal(narratedAudioRate(0.7), 0.7 / 0.9);
    assert.equal(narratedAudioRate(1.15), 1.15 / 0.9);
  });
});
