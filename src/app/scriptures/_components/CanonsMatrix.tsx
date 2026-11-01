"use client";

import { useState, useMemo, useId, useRef, useEffect } from "react";
import Link from "next/link";
import {
  CANONICAL_BOOKS,
  HISTORICAL_MILESTONES,
  TRADITION_METADATA,
  compareTwoTraditions,
  hostedTraditionCount,
  type CanonicalBook,
  type TraditionKey,
} from "@/lib/scriptures/canons-matrix";
import { hostedChapterSummary } from "@/lib/scriptures/edition-counts";

const TRADITION_KEYS: TraditionKey[] = [
  "protestant",
  "catholic",
  "orthodox",
  "ethiopian",
  "armenian",
  "tanakh",
];

export default function CanonsMatrix() {
  const [activeTradition, setActiveTradition] = useState<TraditionKey | "all">("all");
  const [activeStatus, setActiveStatus] = useState<
    "all" | "deutero" | "ot" | "nt" | "dss"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState<CanonicalBook | null>(null);
  const dossierRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedBook) return;
    dossierRef.current?.focus({ preventScroll: true });
    dossierRef.current?.scrollIntoView({ block: "nearest" });
  }, [selectedBook]);

  // Comparator State
  const [comparatorOpen, setComparatorOpen] = useState(false);
  const [compareA, setCompareA] = useState<TraditionKey>("catholic");
  const [compareB, setCompareB] = useState<TraditionKey>("protestant");

  const searchInputId = useId();

  const comparison = useMemo(() => {
    return compareTwoTraditions(compareA, compareB);
  }, [compareA, compareB]);

  const filteredBooks = useMemo(() => {
    return CANONICAL_BOOKS.filter((book) => {
      // Tradition filter
      if (activeTradition !== "all" && !book.inTraditions[activeTradition]) {
        return false;
      }

      // Status filter
      if (activeStatus === "deutero") {
        if (book.testament !== "Deutero" && book.testament !== "Pseudepigrapha") {
          return false;
        }
      } else if (activeStatus === "ot" && book.testament !== "OT") {
        return false;
      } else if (activeStatus === "nt" && book.testament !== "NT") {
        return false;
      } else if (activeStatus === "dss" && !book.manuscripts.includes("DSS")) {
        return false;
      }

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = book.name.toLowerCase().includes(q);
        const matchesId = book.id.toLowerCase().includes(q);
        const matchesCat = book.categoryName.toLowerCase().includes(q);
        const matchesLang = book.originalLanguage.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesCat && !matchesLang) {
          return false;
        }
      }

      return true;
    });
  }, [activeTradition, activeStatus, searchQuery]);

  return (
    <section
      className="scr-matrix-section"
      aria-labelledby="canons-matrix-heading"
      id="canons-matrix"
    >
      <div className="scr-matrix-header">
        <div>
          <p className="kicker">Comparative Canonicity &amp; Tradition Explorer</p>
          <h2 id="canons-matrix-heading">Multi-Canonicity Matrix</h2>
          <p className="scr-matrix-lead">
            Examine which books are received as sacred Scripture across six major
            traditions. Explore manuscript witnesses from the Dead Sea Scrolls, Septuagint,
            and Masoretic Text, with direct links into the hosted record.
          </p>
          <p className="scr-matrix-lead">
            Traditional book totals use each tradition&rsquo;s enumeration. This matrix
            counts hosted entries, which can list additions or parts separately.
            Chapter counts describe the hosted editions; they do not define a tradition&rsquo;s canon.
          </p>
        </div>

        {/* Action controls */}
        <div className="scr-matrix-actions">
          <button
            type="button"
            className={`scr-btn scr-matrix-toggle-btn ${comparatorOpen ? "is-active" : ""}`}
            onClick={() => setComparatorOpen(!comparatorOpen)}
            aria-expanded={comparatorOpen}
          >
            {comparatorOpen ? "Hide Tradition Comparator" : "Compare Two Traditions"}
          </button>
        </div>
      </div>

      {/* Comparator Panel */}
      {comparatorOpen && (
        <div
          className="scr-comparator-panel"
          role="region"
          aria-label="Tradition comparison tool"
        >
          <div className="scr-comparator-head">
            <h3>Side-by-Side Tradition Comparison</h3>
            <p>{comparison.summary}</p>
          </div>

          <div className="scr-comparator-selectors">
            <div className="scr-comparator-col" style={{ flex: "1 1 14rem", minWidth: 0, maxWidth: "100%" }}>
              <label htmlFor="comp-trad-a">Tradition A:</label>
              <select
                id="comp-trad-a"
                value={compareA}
                onChange={(e) => setCompareA(e.target.value as TraditionKey)}
                className="scr-comparator-select"
                style={{ width: "100%", minWidth: 0, maxWidth: "100%" }}
                aria-describedby="comp-trad-a-counts"
              >
                {TRADITION_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {TRADITION_METADATA[k].name}
                  </option>
                ))}
              </select>
              <p id="comp-trad-a-counts" style={{ overflowWrap: "anywhere" }}>
                Traditional enumeration: {TRADITION_METADATA[compareA].canonLabel}.{" "}
                Hosted entries in this matrix: {hostedTraditionCount(compareA)}.
              </p>
            </div>

            <span className="scr-comparator-vs" aria-hidden="true">
              vs.
            </span>

            <div className="scr-comparator-col" style={{ flex: "1 1 14rem", minWidth: 0, maxWidth: "100%" }}>
              <label htmlFor="comp-trad-b">Tradition B:</label>
              <select
                id="comp-trad-b"
                value={compareB}
                onChange={(e) => setCompareB(e.target.value as TraditionKey)}
                className="scr-comparator-select"
                style={{ width: "100%", minWidth: 0, maxWidth: "100%" }}
                aria-describedby="comp-trad-b-counts"
              >
                {TRADITION_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {TRADITION_METADATA[k].name}
                  </option>
                ))}
              </select>
              <p id="comp-trad-b-counts" style={{ overflowWrap: "anywhere" }}>
                Traditional enumeration: {TRADITION_METADATA[compareB].canonLabel}.{" "}
                Hosted entries in this matrix: {hostedTraditionCount(compareB)}.
              </p>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="scr-comparator-presets">
            <span className="scr-comparator-preset-label">Preset Comparisons:</span>
            <button
              type="button"
              className="scr-spark-chip"
              onClick={() => {
                setCompareA("catholic");
                setCompareB("protestant");
              }}
            >
              Catholic vs. Protestant
            </button>
            <button
              type="button"
              className="scr-spark-chip"
              onClick={() => {
                setCompareA("orthodox");
                setCompareB("catholic");
              }}
            >
              Orthodox vs. Catholic
            </button>
            <button
              type="button"
              className="scr-spark-chip"
              onClick={() => {
                setCompareA("ethiopian");
                setCompareB("protestant");
              }}
            >
              Ethiopian vs. Protestant
            </button>
            <button
              type="button"
              className="scr-spark-chip"
              onClick={() => {
                setCompareA("protestant");
                setCompareB("tanakh");
              }}
            >
              Protestant vs. Jewish Tanakh
            </button>
          </div>

          {/* Diff Results Grid */}
          <div className="scr-comparator-diff-grid">
            <div className="scr-diff-card">
              <h4>
                Only in {comparison.tradAName} ({comparison.onlyInA.length})
              </h4>
              {comparison.onlyInA.length === 0 ? (
                <p className="scr-diff-empty">No exclusive books.</p>
              ) : (
                <ul className="scr-diff-list">
                  {comparison.onlyInA.map((b) => (
                    <li key={b.id}>
                      <Link href={b.href} className="scr-diff-book-link">
                        <strong>{b.name}</strong>
                        <span>({b.categoryName})</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="scr-diff-card">
              <h4>
                Only in {comparison.tradBName} ({comparison.onlyInB.length})
              </h4>
              {comparison.onlyInB.length === 0 ? (
                <p className="scr-diff-empty">No exclusive books.</p>
              ) : (
                <ul className="scr-diff-list">
                  {comparison.onlyInB.map((b) => (
                    <li key={b.id}>
                      <Link href={b.href} className="scr-diff-book-link">
                        <strong>{b.name}</strong>
                        <span>({b.categoryName})</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="scr-diff-card">
              <h4>Shared Books ({comparison.shared.length})</h4>
              <p className="scr-diff-note">
                Both {comparison.tradAName} and {comparison.tradBName} receive these books
                as sacred Scripture.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="scr-matrix-toolbar">
        {/* Tradition Chips */}
        <div
          className="scr-matrix-trad-filters"
          role="group"
          aria-label="Filter by tradition"
        >
          <button
            type="button"
            className={`scr-btn scr-filter-pill ${activeTradition === "all" ? "is-active" : ""}`}
            onClick={() => setActiveTradition("all")}
          >
            All Traditions ({CANONICAL_BOOKS.length} hosted entries)
          </button>
          {TRADITION_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              className={`scr-btn scr-filter-pill ${activeTradition === k ? "is-active" : ""}`}
              onClick={() => setActiveTradition(k)}
            >
              {TRADITION_METADATA[k].name} ({hostedTraditionCount(k)} hosted entries)
            </button>
          ))}
        </div>

        {/* Secondary Category / Status Filters */}
        <div className="scr-matrix-status-filters">
          <div className="scr-status-chips">
            <button
              type="button"
              className={`scr-status-chip ${activeStatus === "all" ? "is-active" : ""}`}
              onClick={() => setActiveStatus("all")}
            >
              All Sections
            </button>
            <button
              type="button"
              className={`scr-status-chip ${activeStatus === "deutero" ? "is-active" : ""}`}
              onClick={() => setActiveStatus("deutero")}
            >
              Deuterocanon &amp; Enoch/Jubilees (20)
            </button>
            <button
              type="button"
              className={`scr-status-chip ${activeStatus === "ot" ? "is-active" : ""}`}
              onClick={() => setActiveStatus("ot")}
            >
              Old Testament (39)
            </button>
            <button
              type="button"
              className={`scr-status-chip ${activeStatus === "nt" ? "is-active" : ""}`}
              onClick={() => setActiveStatus("nt")}
            >
              New Testament (27)
            </button>
            <button
              type="button"
              className={`scr-status-chip ${activeStatus === "dss" ? "is-active" : ""}`}
              onClick={() => setActiveStatus("dss")}
            >
              Dead Sea Scrolls Witnesses
            </button>
          </div>

          {/* Search box */}
          <div className="scr-matrix-search-box">
            <label htmlFor={searchInputId} className="sr-only">
              Filter books by name or language
            </label>
            <input
              id={searchInputId}
              type="search"
              placeholder="Search books (e.g. Tobit, Enoch, Hebrew)…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="scr-matrix-search-input"
            />
          </div>
        </div>
      </div>

      {/* Main Comparative Matrix Table */}
      <div className="scr-matrix-table-wrap">
        <table className="scr-matrix-table">
          <caption className="sr-only">
            Canonical comparison matrix across Protestant, Catholic, Orthodox, Ethiopian,
            Armenian, and Jewish traditions
          </caption>
          <thead>
            <tr>
              <th scope="col" className="scr-col-book">
                Book &amp; Category
              </th>
              <th scope="col" className="scr-col-trad">
                Prot
              </th>
              <th scope="col" className="scr-col-trad">
                Cath
              </th>
              <th scope="col" className="scr-col-trad">
                Orth
              </th>
              <th scope="col" className="scr-col-trad">
                Eth
              </th>
              <th scope="col" className="scr-col-trad">
                Arm
              </th>
              <th scope="col" className="scr-col-trad">
                Tanakh
              </th>
              <th scope="col" className="scr-col-witness">
                Witnesses
              </th>
              <th scope="col" className="scr-col-action">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredBooks.map((book) => {
              const isSelected = selectedBook?.id === book.id;
              return (
                <tr
                  key={book.id}
                  className={`scr-matrix-row ${isSelected ? "is-selected" : ""}`}
                  onClick={() => setSelectedBook(isSelected ? null : book)}
                >
                  <td className="scr-col-book">
                    <div className="scr-book-identity">
                      <button type="button" className="scr-book-name" id={`book-counts-${book.id}`}
                        style={{ background: "none", border: 0, padding: 0, color: "inherit", fontFamily: "inherit", fontWeight: 700, textAlign: "left", cursor: "pointer", minHeight: "2.75rem", minWidth: "2.75rem" }}
                        aria-expanded={isSelected}
                        aria-controls={isSelected ? `book-dossier-${book.id}` : undefined}
                        aria-label={`${book.name} — hosted editions and details`}
                        onClick={event => { event.stopPropagation(); setSelectedBook(isSelected ? null : book); }}>
                        {book.name}
                      </button>
                      <span className="scr-book-cat-tag">
                        {book.categoryName} · {hostedChapterSummary(book.hostedEditions)}
                      </span>
                    </div>
                  </td>

                  {/* Tradition presence checks */}
                  <td className="scr-col-trad">
                    {book.inTraditions.protestant ? (
                      <span className="scr-check-yes" title="Included in Protestant canon">
                        ✓
                      </span>
                    ) : (
                      <span className="scr-check-no" title="Excluded in Protestant canon">
                        —
                      </span>
                    )}
                  </td>
                  <td className="scr-col-trad">
                    {book.inTraditions.catholic ? (
                      <span className="scr-check-yes" title="Included in Catholic canon">
                        ✓
                      </span>
                    ) : (
                      <span className="scr-check-no" title="Excluded in Catholic canon">
                        —
                      </span>
                    )}
                  </td>
                  <td className="scr-col-trad">
                    {book.inTraditions.orthodox ? (
                      <span className="scr-check-yes" title="Included in Eastern Orthodox canon">
                        ✓
                      </span>
                    ) : (
                      <span className="scr-check-no" title="Excluded in Eastern Orthodox canon">
                        —
                      </span>
                    )}
                  </td>
                  <td className="scr-col-trad">
                    {book.inTraditions.ethiopian ? (
                      <span className="scr-check-yes" title="Included in Ethiopian canon">
                        ✓
                      </span>
                    ) : (
                      <span className="scr-check-no" title="Excluded in Ethiopian canon">
                        —
                      </span>
                    )}
                  </td>
                  <td className="scr-col-trad">
                    {book.inTraditions.armenian ? (
                      <span className="scr-check-yes" title="Included in Armenian canon">
                        ✓
                      </span>
                    ) : (
                      <span className="scr-check-no" title="Excluded in Armenian canon">
                        —
                      </span>
                    )}
                  </td>
                  <td className="scr-col-trad">
                    {book.inTraditions.tanakh ? (
                      <span
                        className="scr-check-yes"
                        title={book.tanakhCount ?? "Included in Jewish Tanakh"}
                      >
                        ✓
                      </span>
                    ) : (
                      <span className="scr-check-no" title="Excluded in Jewish Tanakh">
                        —
                      </span>
                    )}
                  </td>

                  {/* Manuscript Witnesses */}
                  <td className="scr-col-witness">
                    <div className="scr-witness-tags">
                      {book.manuscripts.map((m) => (
                        <span key={m} className={`scr-witness-tag scr-witness-${m.toLowerCase()}`}>
                          {m}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="scr-col-action" onClick={(e) => e.stopPropagation()}>
                    <Link href={book.href} className="scr-btn scr-read-btn">
                      Read
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Selected Book Detail Drawer */}
      {selectedBook && (
        <div ref={dossierRef} tabIndex={-1} className="scr-book-detail-drawer" id={`book-dossier-${selectedBook.id}`} role="region" aria-label="Book dossier">
          <div className="scr-drawer-head">
            <div>
              <span className="scr-drawer-kicker">
                {selectedBook.categoryName} · {selectedBook.originalLanguage} Original
              </span>
              <h3>{selectedBook.name}</h3>
            </div>
            <button
              type="button"
              className="scr-btn scr-drawer-close"
              onClick={() => {
                document.getElementById(`book-counts-${selectedBook.id}`)?.focus();
                setSelectedBook(null);
              }}
              aria-label="Close dossier"
            >
              ✕
            </button>
          </div>

          <div className="scr-drawer-body">
            <div className="scr-drawer-section">
              <h4>Hosted chapter counts</h4>
              <p>These are the chapter divisions in this site&rsquo;s named editions, not a traditional book enumeration.</p>
              <ul>{selectedBook.hostedEditions.map(edition => <li key={edition.translation}>
                {edition.name}: {edition.chapters} chapter{edition.chapters === 1 ? "" : "s"}
              </li>)}</ul>
            </div>
            <div className="scr-drawer-section">
              <h4>Manuscript Witnesses</h4>
              <p>
                Attested in:{" "}
                <strong>{selectedBook.manuscripts.join(", ")}</strong> (
                {selectedBook.originalLanguage} original language).
              </p>
            </div>

            <div className="scr-drawer-section">
              <h4>Historical &amp; Conciliar Reception</h4>
              <p>{selectedBook.historicalNote}</p>
            </div>

            {selectedBook.tanakhCount && (
              <div className="scr-drawer-section">
                <h4>Jewish Tanakh Enumeration</h4>
                <p>{selectedBook.tanakhCount} (traditional 24-book scroll division).</p>
              </div>
            )}

            <div className="scr-drawer-footer">
              <Link href={selectedBook.href} className="scr-btn scr-primary-btn">
                Open {selectedBook.name} in Reader →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Historical Council Milestones Accordion */}
      <details className="scr-milestones-accordion">
        <summary>
          <strong>Historical Milestones &amp; Canon Decrees (382 AD – 1672 AD)</strong>
          <span className="scr-milestones-hint">Click to inspect historical timeline</span>
        </summary>
        <div className="scr-milestones-timeline">
          {HISTORICAL_MILESTONES.map((m) => (
            <article key={m.year} className="scr-milestone-item">
              <div className="scr-milestone-date-col">
                <span className="scr-milestone-date">{m.dateStr}</span>
                <span className="scr-milestone-trad">{m.tradition}</span>
              </div>
              <div className="scr-milestone-content">
                <h4>{m.title}</h4>
                <p>{m.significance}</p>
              </div>
            </article>
          ))}
        </div>
      </details>
    </section>
  );
}
