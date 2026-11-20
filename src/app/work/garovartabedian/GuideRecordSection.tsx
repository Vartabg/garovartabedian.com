import { SITE_SOURCE_URL } from "@/lib/portfolio-content";
import { packGuideRecord, type GuideRecord as GuideRecordData } from "@/lib/site/guide-record";
import { GUIDE_RECORD } from "@/lib/site/guide-record-data";
import GuideRecord from "./GuideRecord";

const number = new Intl.NumberFormat("en-US");
const have = (n: number) => `${number.format(n)} ${n === 1 ? "has" : "have"}`;

// History, not a measurement: commit b91da770 deleted 829 guide files on 2026-11-20.
const TEMPLATES_REMOVED =
  "On Nov 20, 2026, 829 batch-template guides were removed; those chapters show no guide until one is written and checked.";

/** Every hosted chapter and the checks its guide passed, from the generated guide record. */
export default function GuideRecordSection({ record = GUIDE_RECORD }: { record?: GuideRecordData }) {
  const { totals } = record;
  const count = (states: string[], rows: GuideRecordData["books"][number]["chapters"]) =>
    number.format(rows.filter((row) => states.includes(row.state)).length);

  return (
    <section aria-labelledby="guide-checks">
      <h2 id="guide-checks">Guide checks</h2>
      <div className="guide-record" data-guide-chapters={totals.chapters}>
        <p>
          The Scripture section hosts {number.format(totals.chapters)} chapters. {have(totals.current)} a guide that
          passes every current check. {have(totals.earlier)} a guide that passes only the earlier checks.{" "}
          {have(totals.none)} no guide.
        </p>
        <GuideRecord data={packGuideRecord(record)} />
        {/* Kept under the map, so the map is not pushed down a phone screen. */}
        <p className="guide-record-note">
          An agent panel reviewed {number.format(totals.agentReviewed)} {totals.agentReviewed === 1 ? "guide" : "guides"}.{" "}
          {totals.humanReviewed === 0
            ? "No person has reviewed any."
            : `A person has reviewed ${number.format(totals.humanReviewed)}.`}{" "}
          {TEMPLATES_REMOVED}
        </p>
        <details className="guide-record-table">
          <summary>Every book as a table</summary>
          <table>
            <thead>
              <tr>
                <th scope="col">Book</th>
                <th scope="col">Chapters</th>
                <th scope="col">Current checks</th>
                <th scope="col">Earlier checks</th>
                <th scope="col">No guide</th>
              </tr>
            </thead>
            <tbody>
              {record.books.map((book) => (
                <tr key={book.id}>
                  <th scope="row">{book.name}</th>
                  <td>{number.format(book.chapters.length)}</td>
                  <td>{count(["current"], book.chapters)}</td>
                  <td>{count(["earlier"], book.chapters)}</td>
                  <td>{count(["none"], book.chapters)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
        <p className="guide-record-links">
          <a href={`${SITE_SOURCE_URL}/blob/main/scripts/scriptures/GUIDE_RUBRIC_V2.md`} target="_blank" rel="noopener noreferrer">
            Read the rubric
          </a>
          {" · "}
          <a href={`${SITE_SOURCE_URL}/blob/main/scripts/scriptures/guide-validation.mjs`} target="_blank" rel="noopener noreferrer">
            Read the checks
          </a>
          {" · "}
          <a href="/meta/guide-record.json">Open this record as data</a>
        </p>
      </div>
    </section>
  );
}
