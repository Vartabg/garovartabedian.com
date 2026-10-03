"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { scriptureSearchHref } from "@/lib/scriptures/search-url";
import type { Canons, TranslationId } from "@/lib/scriptures/types";

function SearchQuerySync({
  onQuery,
  onTranslation,
  onScope,
  translations,
}: {
  onQuery: (query: string) => void;
  onTranslation: (translation: TranslationId) => void;
  onScope: (scope: string) => void;
  translations?: Canons["translations"];
}) {
  const params = useSearchParams();
  const query = params.get("q")?.trim().slice(0, 160) ?? "";
  const requestedTranslation = params.get("trans") ?? params.get("t") ?? "web";
  const translation = (
    translations && Object.hasOwn(translations, requestedTranslation)
      ? requestedTranslation
      : "web"
  ) as TranslationId;

  const scope = params.get("scope") ?? params.get("findScope") ?? "";
  useEffect(() => onScope(scope), [onScope, scope]);
  useEffect(() => onQuery(query), [onQuery, query]);
  useEffect(() => onTranslation(translation), [onTranslation, translation]);
  return null;
}

export default function AskBox({
  initial = "",
  translations,
}: {
  initial?: string;
  translations?: Canons["translations"];
}) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  const [scope, setScope] = useState("");
  const [translation, setTranslation] = useState<TranslationId>("web");
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastUrlQueryRef = useRef(initial);

  const syncUrlQuery = useCallback((nextQuery: string) => {
    const input = inputRef.current;
    const previousQuery = lastUrlQueryRef.current;
    lastUrlQueryRef.current = nextQuery;

    if (!input) {
      setQ(nextQuery);
      return;
    }

    // Synchronize intentional URL/history changes only while the field still
    // reflects the preceding URL. Preserve anything typed before hydration.
    if (input.value === previousQuery) input.value = nextQuery;
    setQ(input.value);
  }, []);

  useEffect(() => {
    formRef.current?.setAttribute("data-enhanced", "true");
    setQ(inputRef.current?.value ?? "");
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <form
      ref={formRef}
      className="scr-ask"
      action="/scriptures/search"
      method="get"
      onSubmit={(e) => {
        e.preventDefault();
        const submitted = new FormData(e.currentTarget).get("q");
        router.push(scriptureSearchHref(submitted, translation, scope));
      }}
      role="search"
      aria-label="Search Scriptures"
    >
      {scope && <input type="hidden" name="scope" value={scope} />}
      {translation !== "web" && (
        <input type="hidden" name="trans" value={translation} />
      )}
      <div className="scr-ask-field">
        <input
          ref={inputRef}
          name="q"
          type="search"
          // Keep the native form field authoritative so typing that happens
          // while React hydrates is never replaced by render-time state.
          defaultValue={initial}
          onChange={(e) => setQ(e.target.value)}
          placeholder="A reference, exact words, or an idea…"
          aria-label="Search Scripture"
          aria-keyshortcuts="Meta+K Control+K"
          autoComplete="off"
          spellCheck={false}
          maxLength={160}
        />
        {q && (
          <button
            type="button"
            className="scr-ask-clear"
            aria-label="Clear search"
            onClick={() => {
              setQ("");
              if (inputRef.current) inputRef.current.value = "";
              router.push(scriptureSearchHref(null, translation, scope));
              inputRef.current?.focus();
            }}
          >
            ×
          </button>
        )}
      </div>
      <button type="submit" className="scr-btn">
        Search
      </button>
      <p className="scr-ask-hint">
        Words and phrases use {translations?.[translation].name ?? "the World English Bible"}. Related passages come from
        Nave&rsquo;s 1897 topical index. No generated answers — the text stays
        in view.
      </p>
      <Suspense fallback={null}>
        <SearchQuerySync
          onQuery={syncUrlQuery}
          onTranslation={setTranslation}
          onScope={setScope}
          translations={translations}
        />
      </Suspense>
    </form>
  );
}
