"use client";

import Link from "next/link";
import { useState } from "react";
import type { Canons, Tradition } from "@/lib/scriptures/types";
import Shelf from "../[tradition]/Shelf";

/**
 * Primary book navigation: large name list. Optional visual shelf for study.
 */
export default function BookList({
  tradition,
  canons,
}: {
  tradition: Tradition;
  canons: Canons;
}) {
  const [view, setView] = useState<"list" | "shelf">("list");
  const matIdx = tradition.books.indexOf("MAT");
  const sections =
    matIdx > 0
      ? [
          { label: "Old Testament", books: tradition.books.slice(0, matIdx) },
          { label: "New Testament", books: tradition.books.slice(matIdx) },
        ]
      : [{ label: "Books", books: tradition.books }];

  return (
    <div className="scr-book-nav">
      <div className="scr-view-toggle" role="group" aria-label="Book view">
        <button
          type="button"
          className={view === "list" ? "scr-btn scr-btn-active" : "scr-btn"}
          aria-pressed={view === "list"}
          onClick={() => setView("list")}
        >
          List
        </button>
        <button
          type="button"
          className={view === "shelf" ? "scr-btn scr-btn-active" : "scr-btn"}
          aria-pressed={view === "shelf"}
          onClick={() => setView("shelf")}
        >
          Shelf
        </button>
      </div>

      {view === "shelf" ? (
        <Shelf tradition={tradition} canons={canons} />
      ) : (
        <div className="scr-find">
          {sections.map((sec) => (
            <div key={sec.label} className="scr-find-section">
              <h2 className="scr-shelf-label">
                {sec.label} <span>{sec.books.length} books</span>
              </h2>
              <ul className="scr-book-list">
                {sec.books.map((id) => {
                  const meta = canons.books[id];
                  return (
                    <li key={id}>
                      <Link href={`/scriptures/${tradition.id}/${id}`}>
                        <span className="scr-book-list-name">
                          {meta?.name ?? id}
                        </span>
                        <span className="scr-book-list-meta">
                          {meta?.chapters ?? "?"} chapters
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
