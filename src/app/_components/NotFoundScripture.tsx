"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NOT_FOUND_SCRIPTURES } from "@/lib/not-found-scriptures";
import { Button } from "./Button";

function randomIndex() {
  return Math.floor(Math.random() * NOT_FOUND_SCRIPTURES.length);
}

function nextIndex(current: number) {
  if (NOT_FOUND_SCRIPTURES.length < 2) return current;
  return (current + 1 + Math.floor(Math.random() * (NOT_FOUND_SCRIPTURES.length - 1))) %
    NOT_FOUND_SCRIPTURES.length;
}

export default function NotFoundScripture() {
  const [index, setIndex] = useState(0);

  // Keep a real verse in the server-rendered fallback, then vary it per visit.
  useEffect(() => setIndex(randomIndex()), []);

  const quote = NOT_FOUND_SCRIPTURES[index];

  return (
    <section
      className="card not-found-scripture"
      aria-label="Scripture for the road"
      style={{ margin: "2rem 0" }}
    >
      <div className="kicker">Scripture for the road</div>
      <div aria-live="polite" aria-atomic="true">
        <blockquote
          style={{
            color: "var(--ink)",
            fontSize: "clamp(1.15rem, 3vw, 1.4rem)",
            lineHeight: 1.5,
            margin: "0 0 0.85rem",
          }}
        >
          &ldquo;{quote.text}&rdquo;
        </blockquote>
        <p className="note">
          <cite>
            <Link className="textlink" href={quote.href}>
              {quote.reference}
            </Link>
          </cite>{" "}
          · World English Bible · public domain
        </p>
      </div>
      <Button
        variant="ghost"
        onClick={() => setIndex((current) => nextIndex(current))}
      >
        Show another verse
      </Button>
    </section>
  );
}
