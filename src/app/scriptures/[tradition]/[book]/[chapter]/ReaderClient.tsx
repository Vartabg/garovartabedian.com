"use client";

import { preserveFindContext } from "@/lib/scriptures/search-url";
import { chapterReadingGroups, VERSE_LINED_BOOKS } from "@/lib/scriptures/reading-layout";
import ReadingSearchReturn from "@/app/_components/reading/ReadingSearchReturn";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  loadBook,
  loadChapterGuide,
  loadOriginalChapter,
  loadXref,
} from "@/lib/scriptures/client";
import { getChapterNarration, type ChapterNarration } from "@/lib/scriptures/narration";
import { ORIGINAL_EDITION_DISPLAY } from "@/lib/scriptures/original-editions";
import {
  copyText,
  formatReference,
  formatShareText,
  shareText,
} from "@/lib/scriptures/share";
import type {
  BriefingSource,
  Canons,
  ChapterGuide as ChapterGuideData,
  ChapterNeighbours as ChapterNeighboursData,
  OriginalChapter,
  TranslationId,
  XrefFile,
} from "@/lib/scriptures/types";
import { loadWords } from "@/lib/jesus/client";
import type { WordsData } from "@/lib/jesus/types";
import type { UnseenChapter } from "@/lib/angels/types";
import {
  defaultEasyPrefs,
  readEasyPrefs,
  writeContinue,
  writeEasyPrefs,
  writeStudyTrail,
  type EasyPrefs,
} from "@/lib/scriptures/prefs";
import type { GlossSeen } from "@/lib/glossary/segment";
import {
  buildChapterSpeechSegments,
  speechVoiceOptions,
  startNarratedAudioPlayback,
  startSpeechPlayback,
  type SpeechPlayback,
  type SpeechSegment,
  type SpeechVoiceOption,
} from "@/lib/scriptures/speech";
import Threads from "./Threads";
import ChapterGuide from "./ChapterGuide";
import ChapterContext from "./ChapterContext";
import ChapterNeighbours from "./ChapterNeighbours";
import UnseenRecord from "./UnseenRecord";
import VerseText from "./VerseText";
import VersePanel from "./VersePanel";
import ReaderBar from "./ReaderBar";
import ReaderSettings from "./ReaderSettings";
import SaveOffline from "./SaveOffline";
import ChapterPicker from "./ChapterPicker";
import StudyTable, { type StudyIntent } from "./StudyTable";
import Wheel from "@/app/_components/Wheel";
import Versal from "@/app/_components/Versal";
import GlossThreads from "./GlossThreads";

const OriginalVerseLine = dynamic(() => import("./OriginalVerseLine"));

/** Short version labels for share copy ("John 3:16 (WEB)"). */
const TRANS_ABBR: Record<TranslationId, string> = {
  web: "WEB",
  kjv: "KJV",
  drb: "DRB",
  brenton: "LXX",
  charles: "Charles",
};

// Books whose WEB text carries red-letter (words-of-Jesus) spans. Mirrors
// scripts/jesus/extract-words.mjs so we only fetch the 231KB words.json when it
// can actually apply — not on every Genesis or Psalms view.
const RED_LETTER_BOOKS = new Set<string>([
  "MAT",
  "MRK",
  "LUK",
  "JHN",
  "ACT",
  "1CO",
  "2CO",
  "1TI",
  "REV",
]);

function readerQuery(
  trans: TranslationId,
  compare: TranslationId | null,
  original: boolean,
) {
  return `?t=${trans}${compare ? `&c=${compare}` : ""}${original ? "&o=1" : ""}`;
}

/** A resolved reading variant: which translation, compare, original view. */
type Variant = {
  trans: TranslationId;
  compare: TranslationId | null;
  original: boolean;
};

/** Read ?t/?c/?o from the URL, clamped to what this book actually offers. */
function parseVariantQuery(
  defaultTrans: TranslationId,
  available: readonly TranslationId[],
  search?: string,
): Variant {
  if (search === undefined) return { trans: defaultTrans, compare: null, original: false };
  const params = new URLSearchParams(search);
  const rawT = params.get("t");
  const rawC = params.get("c");
  const rawO = params.get("o");
  const isTrans = (value: string | null): value is TranslationId =>
    value !== null && (available as readonly string[]).includes(value);
  const trans = isTrans(rawT) ? rawT : defaultTrans;
  const rawCompare = isTrans(rawC) ? rawC : null;
  return {
    trans,
    compare: rawCompare && rawCompare !== trans ? rawCompare : null,
    original: rawO === "1",
  };
}

type ReaderClientProps = {
  canons: Canons;
  /** The viewed chapter in the tradition's default translation. */
  initialVerses: string[] | null;
  initialTrans: TranslationId;
  chapterCount: number;
  traditionId: string;
  bookId: string;
  chapter: number;
  originalTranslations: TranslationId[];
  initialGuide: ChapterGuideData | null;
  guideSources?: BriefingSource[];
  neighbours: ChapterNeighboursData | null;
  /** Angels & Demons records and vocabulary for this chapter, or null when the world never touches it. */
  unseen: UnseenChapter | null;
};

/**
 * The chapter reader.
 *
 * Rebuilt 2026-07-25 around one rule: **the text is the interface.** Verse 1
 * is on the first screen; nothing floats over the words you are reading; a tap
 * on the text selects text, the way a tap on text has always worked. Study
 * depth is one deliberate tap away — the verse number opens that verse's tools
 * inline beneath it, and the chapter's cheat sheet and cross-reference map sit
 * below the reading, where they belong.
 */
export default function ReaderClient({
  canons,
  initialVerses,
  initialTrans,
  chapterCount,
  traditionId,
  bookId,
  chapter,
  originalTranslations,
  initialGuide,
  guideSources = [],
  neighbours,
  unseen,
}: ReaderClientProps) {
  const router = useRouter();
  const [xref, setXref] = useState<XrefFile | null>(null);
  const [openVerse, setOpenVerse] = useState<number | null>(null);
  const [selVerses, setSelVerses] = useState<number[]>([]);
  const [selNote, setSelNote] = useState<string | null>(null);
  const [words, setWords] = useState<WordsData | null>(null);
  const [redLetter, setRedLetter] = useState(false);
  const [showThreads, setShowThreads] = useState(false);
  const [guide, setGuide] = useState<ChapterGuideData | null>(initialGuide);
  const [guideTried, setGuideTried] = useState(!!initialGuide);
  const [guideOpen, setGuideOpen] = useState(false);
  const [studyIntent, setStudyIntent] = useState<StudyIntent>("read");
  const [pickOpen, setPickOpen] = useState(false);
  const [setsOpen, setSetsOpen] = useState(false);
  const [easy, setEasy] = useState<EasyPrefs>(defaultEasyPrefs);
  const [canUseDeviceSpeech, setCanUseDeviceSpeech] = useState(false);
  const [speechMode, setSpeechMode] = useState<"chapter" | "preview" | null>(null);
  const [speechVoices, setSpeechVoices] = useState<SpeechVoiceOption[]>([]);
  const playbackRef = useRef<SpeechPlayback | null>(null);

  // ── Reading variant state (translation / compare / original) ───────────
  // The page is a static shell in the tradition's default translation;
  // variant views are pure client state, kept in the URL so links are
  // shareable. URL is the source of truth on first load only — after that,
  // state drives the URL (history.replaceState) so switching a translation
  // never re-downloads the shell it would render identically.
  const meta = canons.books[bookId];
  const [trans, setTrans] = useState<TranslationId>(initialTrans);
  const [compare, setCompare] = useState<TranslationId | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [verses, setVerses] = useState<string[] | null>(initialVerses);
  const [compareVerses, setCompareVerses] = useState<string[] | null>(null);
  const [original, setOriginal] = useState<OriginalChapter | null>(null);
  type RequestStatus = "ready" | "loading" | "error" | "comparison-error";
  const [requestStatus, setRequestStatus] = useState<RequestStatus>("ready");
  const [narration, setNarration] = useState<ChapterNarration | null>(() =>
    getChapterNarration(initialTrans, bookId, chapter),
  );

  const tradition = canons.traditions.find((t) => t.id === traditionId)!;
  const base = `/scriptures/${tradition.id}/${bookId}`;
  const currentBookIndex = tradition.books.indexOf(bookId);
  const originalAvailable = originalTranslations.includes(trans) &&
    (!compare || originalTranslations.includes(compare));
  const q = readerQuery(trans, compare, showOriginal);
  const selecting = selVerses.length > 0;
  const canListen = Boolean(narration) || canUseDeviceSpeech;

  // URL is read once on mount (shared links with ?t/?c/?o keep working), then
  // state owns the URL. This is the App-Router-sanctioned way to vary a static
  // page without re-rendering it on the server.
  const variantRequest = useRef(0);
  const applyVariant = useCallback(
    async (next: Variant) => {
      const ticket = ++variantRequest.current;
      setTrans(next.trans);
      setCompare(next.compare);
      const nextOriginal = next.original && originalTranslations.includes(next.trans) &&
        (!next.compare || originalTranslations.includes(next.compare));
      setShowOriginal(nextOriginal);
      // Narration is a lookup in a bundled manifest, not a fetch, so it settles
      // with the rest of the synchronous state. It used to be set after the
      // awaits below, which left a real window on a shared ?t=kjv link: the
      // reader saw KJV selected, tapped Listen before the chapter JSON arrived,
      // and got the WEB recording. Wider on a slow connection, and the reason
      // the narration e2e failed about half the time.
      setNarration(getChapterNarration(next.trans, bookId, chapter));
      // Clear verse data synchronously so SaveOffline (disabled while verses
      // is null) cannot save the previous translation's verses under the new
      // translation's identity while the fetch is pending, fails, or is
      // superseded. Stale verses would also feed speech and compare views.
      setVerses(null);
      setCompareVerses(null);
      setOriginal(null);
      setRequestStatus("loading");
      try {
        const [book, comparison, originalChapter] = await Promise.all([
          loadBook(next.trans, bookId),
          next.compare ? loadBook(next.compare, bookId).then(
            (book) => ({ book, failed: false }),
            () => ({ book: null, failed: true }),
          ) : null,
          nextOriginal ? loadOriginalChapter(bookId, chapter) : null,
        ]);
        if (ticket !== variantRequest.current) return; // superseded by a newer tap
        const resolvedVerses = book?.chapters[chapter - 1] ?? null;
        setVerses(resolvedVerses);
        setCompareVerses(
          next.compare ? (comparison?.book?.chapters[chapter - 1] ?? null) : null,
        );
        setOriginal(originalChapter);
        setRequestStatus(resolvedVerses && comparison?.failed ? "comparison-error" : "ready");
        history.replaceState(
          history.state,
          "",
          preserveFindContext(`${base}/${chapter}${readerQuery(next.trans, next.compare, nextOriginal)}${location.hash}`, new URLSearchParams(location.search)),
        );
      } catch {
        if (ticket !== variantRequest.current) return; // superseded by a newer tap
        setVerses(null);
        setCompareVerses(null);
        setOriginal(null);
        setRequestStatus("error");
      }
    },
    [base, bookId, chapter, originalTranslations],
  );

  // URL is read once on mount (shared links with ?t/?c/?o keep working), then
  // state owns the URL. This is the App-Router-sanctioned way to vary a static
  // page without re-rendering it on the server.
  useEffect(() => {
    const wanted = parseVariantQuery(initialTrans, meta.trans, window.location.search);
    const isDefault =
      wanted.trans === initialTrans && !wanted.compare && !wanted.original;
    if (!isDefault) void applyVariant(wanted);
    // Runs exactly once per page (tradition/book/chapter); the URL cannot
    // change under the component without a navigation that remounts it.
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setEasy(readEasyPrefs());
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const synth = window.speechSynthesis;
    const refreshVoices = () => setSpeechVoices(speechVoiceOptions(synth.getVoices()));
    setCanUseDeviceSpeech(true);
    refreshVoices();
    synth.addEventListener("voiceschanged", refreshVoices);
    const retry = window.setTimeout(refreshVoices, 250);
    return () => {
      window.clearTimeout(retry);
      synth.removeEventListener("voiceschanged", refreshVoices);
    };
  }, []);

  // Reset every transient panel when the reader moves.
  useEffect(() => {
    setXref(null);
    setOpenVerse(null);
    setSelVerses([]);
    setSelNote(null);
    setShowThreads(false);
    setGuide(initialGuide);
    setGuideTried(!!initialGuide);
    setGuideOpen(false);
    setStudyIntent("read");
    setPickOpen(false);
    setSetsOpen(false);
  }, [bookId, chapter, trans, compare, initialGuide]);

  // Persist continue-reading pointer
  useEffect(() => {
    if (!meta) return;
    const entry = {
      traditionId: tradition.id,
      bookId,
      bookName: meta.name,
      chapter,
      href: `${base}/${chapter}${q}`,
      updatedAt: Date.now(),
    };
    writeContinue(entry);
    writeStudyTrail(entry);
  }, [tradition.id, bookId, chapter, meta, base, q]);

  useEffect(() => {
    let live = true;
    setWords(null);
    if (trans === "web" && RED_LETTER_BOOKS.has(bookId))
      loadWords().then((w) => live && setWords(w), () => {});
    return () => {
      live = false;
    };
  }, [trans, bookId]);

  // Cross-references load on first demand — opening a verse or the map.
  const wantXref = openVerse !== null || showThreads;
  useEffect(() => {
    if (!wantXref) return;
    let live = true;
    loadXref(bookId).then((x) => live && setXref(x));
    return () => {
      live = false;
    };
  }, [wantXref, bookId]);

  useEffect(() => {
    if (verses && location.hash)
      document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: "center" });
  }, [verses]);

  useEffect(() => {
    if (!selNote) return;
    const t = setTimeout(() => setSelNote(null), 2000);
    return () => clearTimeout(t);
  }, [selNote]);

  // ── Read aloud ─────────────────────────────────────────────────────────
  const chapterSpeech = useMemo(() => {
    if (!verses) return [];
    return buildChapterSpeechSegments(meta.name, chapter, verses);
  }, [verses, meta.name, chapter]);

  const stopSpeech = useCallback(() => {
    playbackRef.current?.cancel();
    playbackRef.current = null;
    if (typeof window !== "undefined" && "speechSynthesis" in window)
      window.speechSynthesis.cancel();
    setSpeechMode(null);
  }, []);

  // Speech does not survive navigation, and a voice that keeps reading the
  // chapter you left is the most disorienting thing a reader can hit.
  useEffect(() => stopSpeech, [stopSpeech, bookId, chapter, trans]);

  const beginSpeech = (segments: SpeechSegment[], mode: "chapter" | "preview") => {
    let playback: SpeechPlayback | null = null;
    const clear = () => {
      if (playback && playbackRef.current === playback) {
        playbackRef.current = null;
        setSpeechMode(null);
      }
    };
    playback = startSpeechPlayback({
      segments,
      voiceURI: easy.speechVoice,
      rate: easy.speechRate,
      onEnd: clear,
      onStop: clear,
      onError: clear,
    });
    if (!playback) return;
    playbackRef.current = playback;
    setSpeechMode(mode);
  };

  const beginNarration = () => {
    if (!narration) return;
    let playback: SpeechPlayback | null = null;
    const clear = () => {
      if (playback && playbackRef.current === playback) {
        playbackRef.current = null;
        setSpeechMode(null);
      }
    };
    const fallback = () => {
      clear();
      if (canUseDeviceSpeech && chapterSpeech.length)
        beginSpeech(chapterSpeech, "chapter");
    };
    playback = startNarratedAudioPlayback({
      src: narration.src,
      rate: easy.speechRate,
      onEnd: clear,
      onStop: clear,
      onError: fallback,
    });
    if (!playback) {
      fallback();
      return;
    }
    playbackRef.current = playback;
    setSpeechMode("chapter");
  };

  const toggleListen = () => {
    if (speechMode === "chapter") {
      stopSpeech();
      return;
    }
    if (!chapterSpeech.length) return;
    if (narration) beginNarration();
    else beginSpeech(chapterSpeech, "chapter");
  };

  const toggleVoicePreview = () => {
    if (speechMode === "preview") {
      stopSpeech();
      return;
    }
    beginSpeech(
      [
        {
          text: "The words should feel alive, not announced. This is the voice your reader will use.",
          pauseAfterMs: 0,
        },
      ],
      "preview",
    );
  };

  // ── Keyboard: arrows page the chapter, Escape closes what is open ───────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && el.closest("input, select, textarea, [contenteditable]")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Escape") {
        if (openVerse !== null) setOpenVerse(null);
        else if (selecting) setSelVerses([]);
        return;
      }
      if (pickOpen || setsOpen) return;
      if (e.key === "ArrowLeft" && chapter > 1) router.push(`${base}/${chapter - 1}${q}`);
      if (e.key === "ArrowRight" && chapter < chapterCount)
        router.push(`${base}/${chapter + 1}${q}`);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [
    base,
    chapter,
    chapterCount,
    openVerse,
    pickOpen,
    q,
    router,
    selecting,
    setsOpen,
  ]);

  // ── Selection & sharing ────────────────────────────────────────────────
  const toggleSelect = (n: number) =>
    setSelVerses((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n],
    );

  const selectionPayload = () => {
    const list = [...selVerses]
      .sort((a, b) => a - b)
      .map((n) => ({ n, text: verses?.[n - 1] ?? "" }))
      .filter((v) => v.text.trim());
    const first = list[0]?.n ?? 1;
    const url = `${window.location.origin}${base}/${chapter}${q}#v${first}`;
    return {
      title: formatReference(meta.name, chapter, list.map((v) => v.n)),
      text: formatShareText({
        bookName: meta.name,
        chapter,
        verses: list,
        transLabel: TRANS_ABBR[trans],
        url,
      }),
      url,
    };
  };

  const setEasyField = <K extends keyof EasyPrefs>(key: K, value: EasyPrefs[K]) => {
    setEasy((prev) => {
      const next = { ...prev, [key]: value };
      writeEasyPrefs(next);
      return next;
    });
  };

  const scrollToStudyTarget = (id: string) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ block: "start" });
      });
    });
  };

  const setChapterGuideOpen = async (next: boolean) => {
    if (next && !guide && !guideTried) {
      setGuideTried(true);
      const loadedGuide = await loadChapterGuide(bookId, chapter);
      if (loadedGuide) setGuide(loadedGuide);
    }
    setGuideOpen(next);
  };

  const chooseStudyIntent = (intent: StudyIntent) => {
    setStudyIntent(intent);
    if (intent === "read") {
      scrollToStudyTarget("chapter-text");
      return;
    }
    if (intent === "understand") {
      void setChapterGuideOpen(true).then(() => scrollToStudyTarget("study"));
      return;
    }
    if (intent === "connect") {
      setShowThreads(true);
      scrollToStudyTarget("connections");
      return;
    }
    if (showOriginal) {
      scrollToStudyTarget("original-language");
    } else if (originalAvailable) {
      void applyVariant({ trans, compare, original: true });
    } else {
      setSetsOpen(true);
    }
  };

  // ── Verse rendering ────────────────────────────────────────────────────
  const refsFor = (v: number) => xref?.refs[`${chapter}:${v}`] ?? [];
  const bookWords = trans === "web" ? words?.books[bookId] : undefined;
  const hasRedLetter = !!bookWords && Object.keys(bookWords).length > 0;
  const redFor = (v: number) => bookWords?.[`${chapter}:${v}`];

  // One map per chapter render keeps glossary underlines sparse.
  const glossSeen: GlossSeen = new Map();

  const verseBody = (v: string, n: number) => {
    const red = redLetter ? redFor(n) : undefined;
    if (!red) return <VerseText text={v} seen={glossSeen} />;
    const idx = v.indexOf(red);
    if (idx < 0)
      return (
        <span className="scr-red">
          <VerseText text={v} seen={glossSeen} />
        </span>
      );
    return (
      <>
        {idx > 0 && <VerseText text={v.slice(0, idx)} seen={glossSeen} />}
        <span className="scr-red">
          <VerseText text={red} seen={glossSeen} />
        </span>
        <VerseText text={v.slice(idx + red.length)} seen={glossSeen} />
      </>
    );
  };

  const transName = canons.translations[trans]?.name ?? trans;
  const transLicense = canons.translations[trans]?.license ?? "Hosted edition";
  const originalByVerse = useMemo(
    () => new Map(original?.verses.map((verse) => [verse.number, verse]) ?? []),
    [original],
  );
  const originalEdition = original ? ORIGINAL_EDITION_DISPLAY[original.edition] : null;
  const verseLined = VERSE_LINED_BOOKS.has(bookId);
  const flow = easy.flow && !original && !compare && !verseLined;
  const readingClass = `scr-read-text reading-prose${flow ? " scr-flow" : ""}${original ? " scr-has-original" : ""}`;
  const readingGroups = useMemo(() => chapterReadingGroups(verses ?? [], bookId), [verses, bookId]);

  return (
    <div className="scr-read" data-reading-surface data-reading-mode={studyIntent === "read" ? "read" : "trace"} data-reading-edition={trans}>
      <ReadingSearchReturn />
      <div className="scr-leaf">
      {/* The running head: book and chapter at the top of the leaf, one
          quiet provenance line, and the way back on the right. */}
      <header className="scr-rh">
        <div>
            <h1 className="scr-rh-title">
              {meta.name} <span className="scr-rh-ch">{chapter}</span>
            </h1>
            <p className="scr-read-meta">
              {transName}
              {verses ? ` · ${verses.filter(Boolean).length} verses` : ""}
              {compare
                ? ` · compared with ${canons.translations[compare]?.name}`
                : ""}
              {originalEdition
                ? ` · ${originalEdition.language} source text`
                : ""}
              {" · "}
              <a href="#study">
                {guide ? `${guide.questions.length} questions below` : "Study below"}
              </a>
            </p>
        </div>
        <nav className="scr-rh-crumbs" aria-label="Breadcrumb">
          <Link href="/scriptures">Scriptures</Link>{" "}
          <span aria-hidden="true">/</span>{" "}
          <Link href={`/scriptures/${tradition.id}`}>{tradition.name}</Link>{" "}
          <span aria-hidden="true">/</span>{" "}
          <Link href={`/scriptures/${tradition.id}/${bookId}`}>{meta.name}</Link>
        </nav>
      </header>
      <div className="scr-rh-tools">
        <SaveOffline key={`${bookId}/${chapter}/${trans}`} bookId={bookId} bookName={meta.name}
          chapter={chapter} translation={trans} translationName={transName} license={transLicense}
          sourcePath={`${base}/${chapter}?t=${trans}`} verses={verses} />
      </div>

      <div className="scr-study-layout">
        <GlossThreads openVerse={openVerse} refs={openVerse !== null ? refsFor(openVerse) : []} />
        <StudyTable
          bookId={bookId}
          bookName={meta.name}
          chapter={chapter}
          chapterCount={chapterCount}
          verseCount={verses?.filter(Boolean).length ?? 0}
          traditionName={tradition.name}
          translationName={transName}
          translation={trans}
          translationLicense={transLicense}
          guide={guide}
          originalAvailable={originalAvailable}
          showOriginal={showOriginal}
          compareName={compare ? (canons.translations[compare]?.name ?? compare) : null}
          hasConnections={Object.keys(xref?.refs ?? {}).some(key => key.startsWith(`${chapter}:`)) || !!neighbours?.neighbours.length}
          activeIntent={studyIntent}
          onIntent={chooseStudyIntent}
          canons={canons}
          tradition={tradition}
          openVerse={openVerse}
          openRefs={openVerse !== null ? refsFor(openVerse) : []}
        />

        <div className="scr-study-reading">
          <ChapterContext
            guide={guide}
            bookName={meta.name}
            baseHref={base}
            sources={guideSources}
            editionName={guide?.readingContextSource && canons.translations[guide.readingContextSource.translation]?.name}
          />
          {!verses && requestStatus === "loading" && (
            <p className="scr-empty" role="status">
              Loading {transName} text…
            </p>
          )}
          {!verses && requestStatus === "error" && (
            <p className="scr-empty" role="alert">
              Could not load {transName} text. Check your connection and try again.
            </p>
          )}
          {!verses && requestStatus === "ready" && (
            <p className="scr-empty">
              This chapter isn&rsquo;t in {transName} — pick another version with
              <strong> Aa</strong> in the bar below.
            </p>
          )}

          {compare && requestStatus === "comparison-error" && (
            <p className="scr-empty" role="alert">
              Could not load {canons.translations[compare]?.name ?? compare} comparison text.
              {" "}{transName} is still available to read and save.
            </p>
          )}

          {compare && compareVerses && verses && (
            <p className="scr-cmp-legend">
              <span>{transName}</span>
              <span>{canons.translations[compare]?.name ?? compare}</span>
            </p>
          )}

          {originalEdition && (
            <aside
              id="original-language"
              className="scr-original-legend"
              aria-label="Original-language edition"
            >
              <strong>
                {originalEdition.language} · {originalEdition.short}
              </strong>
              <span>Tap a source word for its lemma or lexical ID and grammatical parsing.</span>
              <a href="/sources#scripture-texts">Edition and license</a>
            </aside>
          )}

          {verses && (
            <article
              id="chapter-text"
              className={readingClass}
              aria-label={`${meta.name} chapter ${chapter}`}
            >
              {readingGroups.map(group => <div className="scr-reading-paragraph" key={group[0]} data-reading-group={group[0] + 1}>
              {group.map(i => {
                const v = verses[i];
                const n = i + 1;
                const cv =
                  compare && compareVerses ? (compareVerses[i] ?? "") : null;
                const picked = selVerses.includes(n);
                const open = openVerse === n;
                const panelId = `vp${n}`;
                const refs = refsFor(n);
                const originalVerse = originalByVerse.get(n);
                return (
                  <div
                    className={`scr-v${/[\r\n]/.test(v) ? " scr-lined-verse" : ""}${picked ? " is-picked" : ""}${open ? " is-open" : ""}`}
                    key={n}
                    id={`v${n}`}
                  >
                    <p className={`scr-verse${cv !== null ? " scr-cmp" : ""}`}>
                      <button
                        type="button"
                        className="scr-vnum"
                        onClick={() => {
                          if (selecting) toggleSelect(n);
                          else setOpenVerse(open ? null : n);
                        }}
                        aria-expanded={selecting ? undefined : open}
                        aria-controls={open ? panelId : undefined}
                        aria-pressed={selecting ? picked : undefined}
                        aria-label={
                          selecting
                            ? `Verse ${n}, ${picked ? "selected" : "not selected"}`
                            : `Verse ${n} — open study tools`
                        }
                      >
                        {n}
                      </button>
                      {cv !== null ? (
                        <span className="scr-cmp-cells">
                          <span>
                            {v ? verseBody(v, n) : <span className="scr-gap">—</span>}
                          </span>
                          <span>
                            {cv ? (
                              <VerseText text={cv} seen={glossSeen} />
                            ) : (
                              <span className="scr-gap">—</span>
                            )}
                          </span>
                        </span>
                      ) : v ? (
                        // The versal: the chapter's first letter in gold leaf.
                        // Skipped when the first character is punctuation or
                        // when the red-letter layer claims the opening verse.
                        n === 1 && !(redLetter && redFor(1)) && /^[A-Za-z\u00C0-\u024F]/.test(v) ? (
                          <>
                            <Versal letter={v[0]} className="scr-versal" />
                            <VerseText text={v.slice(1)} seen={glossSeen} />
                          </>
                        ) : (
                          verseBody(v, n)
                        )
                      ) : (
                        <span className="scr-gap">—</span>
                      )}
                    </p>
                    {original && originalVerse && (
                      <OriginalVerseLine chapter={original} verse={originalVerse} />
                    )}
                    {open && v && (
                      <VersePanel
                        id={panelId}
                        n={n}
                        text={v}
                        refs={refs}
                        canons={canons}
                        tradition={tradition}
                        trans={trans}
                        transLabel={TRANS_ABBR[trans]}
                        bookName={meta.name}
                        chapter={chapter}
                        chapterHref={`${base}/${chapter}${q}`}
                        selected={picked}
                        speechVoice={easy.speechVoice}
                        speechRate={easy.speechRate}
                        onToggleSelect={() => toggleSelect(n)}
                        onClose={() => setOpenVerse(null)}
                      />
                    )}
                  </div>
                );
              })}
              </div>)}
            </article>
          )}

          <details className="reading-layout-note">
            <summary>About this reading layout</summary>
            <p>Reading paragraphs add editorial spacing between unchanged verses. They do not reconstruct the original manuscript’s paragraphs. Verse numbers, supplied line breaks and citation links are retained. Books such as Psalms and Proverbs keep verses on separate lines; original-language and comparison views stay aligned by verse. Choose One verse per line in Reading settings whenever you prefer.</p>
          </details>
          <p className="scr-read-hint">
            Tap any verse number for its cross-references, audio, and share links.
            Dotted words have a plain-language definition.
          </p>

          <section id="study" className="scr-read-after" aria-labelledby="study-h">
            <h2 id="study-h" className="scr-read-after-h">
              <Wheel />
              Go deeper — {meta.name} {chapter}
            </h2>

            <ChapterGuide
              guide={guide}
              bookName={meta.name}
              chapter={chapter}
              baseHref={base}
              sources={guideSources}
              open={guideOpen}
              onToggle={setChapterGuideOpen}
            />

            <div id="connections" className="scr-threads-block">
              <button
                type="button"
                className="scr-wide-toggle"
                aria-expanded={showThreads}
                onClick={() => setShowThreads((s) => !s)}
              >
                <span>
                  <strong>Cross-reference map</strong>
                  <small>Every thread leaving this chapter, drawn across the canon</small>
                </span>
                <span aria-hidden="true">{showThreads ? "–" : "+"}</span>
              </button>
              {showThreads && (
                <Threads
                  canons={canons}
                  tradition={tradition}
                  bookId={bookId}
                  chapter={chapter}
                  xref={xref}
                />
              )}
            </div>

            <ChapterNeighbours
              data={neighbours}
              translation={trans}
              canons={canons}
              traditionId={tradition.id}
              bookName={meta.name}
              chapter={chapter}
            />

            <UnseenRecord data={unseen} bookName={meta.name} chapter={chapter} />

            <nav className="scr-read-onward" aria-label="Continue reading">
              {chapter > 1 && (
                <Link href={`${base}/${chapter - 1}${q}`} rel="prev">
                  ← {meta.name} {chapter - 1}
                </Link>
              )}
              {chapter < chapterCount && (
                <Link href={`${base}/${chapter + 1}${q}`} rel="next">
                  {meta.name} {chapter + 1} →
                </Link>
              )}
              {currentBookIndex > 0 && (
                <Link
                  href={`/scriptures/${tradition.id}/${tradition.books[currentBookIndex - 1]}`}
                >
                  ← {canons.books[tradition.books[currentBookIndex - 1]]?.name}
                </Link>
              )}
              {currentBookIndex >= 0 && currentBookIndex < tradition.books.length - 1 && (
                <Link
                  href={`/scriptures/${tradition.id}/${tradition.books[currentBookIndex + 1]}`}
                >
                  {canons.books[tradition.books[currentBookIndex + 1]]?.name} →
                </Link>
              )}
            </nav>
          </section>
        </div>
      </div>
      </div>

      <ReaderBar
        label={`${meta.name} ${chapter}`}
        prevHref={chapter > 1 ? `${base}/${chapter - 1}${q}` : null}
        nextHref={chapter < chapterCount ? `${base}/${chapter + 1}${q}` : null}
        onPick={() => setPickOpen(true)}
        onSettings={() => setSetsOpen(true)}
        onListen={toggleListen}
        listening={speechMode === "chapter"}
        canListen={canListen && !!verses}
        pickOpen={pickOpen}
        settingsOpen={setsOpen}
      />

      {pickOpen && (
        <ChapterPicker
          canons={canons}
          tradition={tradition}
          bookId={bookId}
          bookName={meta.name}
          chapter={chapter}
          chapterCount={chapterCount}
          hrefFor={(n) => `${base}/${n}${q}`}
          onClose={() => setPickOpen(false)}
        />
      )}

      {setsOpen && (
        <ReaderSettings
          prefs={easy}
          onChange={setEasyField}
          canons={canons}
          meta={meta}
          trans={trans}
          compare={compare}
          originalAvailable={originalAvailable}
          showOriginal={showOriginal}
          onTrans={(next) =>
            void applyVariant({ trans: next, compare: null, original: showOriginal })
          }
          onCompare={(next) =>
            void applyVariant({ trans, compare: next, original: showOriginal })
          }
          onOriginal={(next) =>
            void applyVariant({ trans, compare, original: next })
          }
          redLetter={redLetter}
          onRedLetter={setRedLetter}
          hasRedLetter={hasRedLetter}
          canListen={canListen}
          canUseDeviceSpeech={canUseDeviceSpeech}
          narration={narration}
          speechVoices={speechVoices}
          previewingVoice={speechMode === "preview"}
          onPreviewVoice={toggleVoicePreview}
          onClose={() => setSetsOpen(false)}
        />
      )}

      {selecting && verses && (
        <div className="scr-selbar" role="region" aria-label="Selected verses">
          <span className="scr-selbar-ref">
            {formatReference(meta.name, chapter, selVerses)}
          </span>
          <button
            type="button"
            className="scr-btn"
            onClick={async () =>
              setSelNote(
                (await copyText(selectionPayload().text)) ? "Copied" : "Copy failed",
              )
            }
          >
            Copy
          </button>
          <button
            type="button"
            className="scr-btn"
            onClick={async () => {
              if ((await shareText(selectionPayload())) === "copied") setSelNote("Copied");
            }}
          >
            Share
          </button>
          <button type="button" className="scr-btn" onClick={() => setSelVerses([])}>
            Clear
          </button>
          <span className="scr-selbar-note" role="status">
            {selNote ?? ""}
          </span>
        </div>
      )}
    </div>
  );
}
