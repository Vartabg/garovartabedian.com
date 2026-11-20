"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useRef, useSyncExternalStore } from "react";
import { Button } from "@/app/_components/Button";

export type ShelfCard = {
  id: string;
  title: string;
  reference: string;
  href: string;
  picture: string;
};

export type ShelfChoice = {
  id: string;
  label: string;
  /** Story id to the line and verse that put the story under this word. */
  tags: Record<string, { line: string; ref: string; quoted: boolean }>;
};

/** The address keeps the chosen word, so Back from a story returns to the same list. */
const PARAM = "were";
const CHANGED = "story-shelf:choice";

/** One picture size for both layouts, so choosing a word refetches nothing. */
const PICTURE_SIZES = "(max-width: 40rem) 50vw, 15rem";

const subscribeNever = () => () => {};

function subscribeToChoice(notify: () => void) {
  window.addEventListener("popstate", notify);
  window.addEventListener(CHANGED, notify);
  return () => {
    window.removeEventListener("popstate", notify);
    window.removeEventListener(CHANGED, notify);
  };
}

const readChoice = () => new URLSearchParams(window.location.search).get(PARAM);
const noChoice = () => null;

/**
 * Every told story, in one list. The server sends all of it; the buttons only
 * narrow what is already on the page.
 */
export default function StoryShelf({
  stories,
  choices,
}: {
  stories: readonly ShelfCard[];
  choices: readonly ShelfChoice[];
}) {
  // False on the server and during hydration, true afterwards.
  const hydrated = useSyncExternalStore(subscribeNever, () => true, () => false);
  // The address is the state. An unknown value matches no choice and shows everything.
  const wanted = useSyncExternalStore(subscribeToChoice, readChoice, noChoice);
  const leadId = useId();
  const group = useRef<HTMLDivElement>(null);

  const current = choices.find((choice) => choice.id === wanted) ?? null;
  const shown = current ? stories.filter((story) => current.tags[story.id]) : stories;

  function choose(id: string | null) {
    const next = id && id !== current?.id ? id : null;
    const url = new URL(window.location.href);
    if (next) url.searchParams.set(PARAM, next);
    else url.searchParams.delete(PARAM);
    // `null` state on purpose: Next's history patch then updates the router's own address.
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    window.dispatchEvent(new Event(CHANGED));
  }

  function showAll() {
    // This control goes away when used, so focus returns to the word that was chosen.
    group.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus();
    choose(null);
  }

  return (
    <>
      <p className="storyshelf-lead" id={leadId}>
        The people in these stories were
      </p>
      <div className="storyshelf-choices" role="group" aria-labelledby={leadId} ref={group}>
        {choices.map((choice) => (
          <Button
            key={choice.id}
            type="button"
            size="sm"
            variant="secondary"
            disabled={!hydrated}
            aria-pressed={choice.id === current?.id}
            onClick={() => choose(choice.id)}
          >
            {choice.label}
          </Button>
        ))}
      </div>
      <div className="storyshelf-count">
        <p aria-live="polite">
          {current
            ? `${shown.length} ${shown.length === 1 ? "story" : "stories"} where people were ${current.label}`
            : `All ${stories.length} stories, from Genesis to Acts`}
        </p>
        {current ? (
          <Button type="button" size="sm" variant="ghost" onClick={showAll}>
            Show all {stories.length}
          </Button>
        ) : null}
      </div>
      <ul className={current ? "storyshelf-list storyshelf-list--rows" : "storyshelf-list"}>
        {shown.map((story, index) => {
          const tag = current?.tags[story.id];
          return (
            <li key={story.id}>
              <Link className="storyshelf-card" href={story.href}>
                <div className="storyshelf-picture">
                  {/* The title follows in the same link, so the picture adds no second name. */}
                  <Image
                    src={story.picture}
                    alt=""
                    fill
                    sizes={PICTURE_SIZES}
                    quality={70}
                    loading={index < 2 ? "eager" : "lazy"}
                  />
                </div>
                <div className="storyshelf-words">
                  <h2>{story.title}</h2>
                  <p className="storyshelf-ref">
                    {story.reference === story.title ? `Book of ${story.reference}` : story.reference}
                  </p>
                  {tag ? (
                    <p className="storyshelf-why">
                      {tag.quoted ? `“${tag.line}”` : tag.line} <span>{tag.ref}</span>
                    </p>
                  ) : null}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
