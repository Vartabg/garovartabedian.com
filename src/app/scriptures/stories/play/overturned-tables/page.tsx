import type { Metadata } from "next";
import Link from "next/link";
import TempleGame from "./TempleGame";
import TempleReading, { markPassage, templePainting } from "./TempleReading";
import "./temple.css";

const title = "The overturned tables";
const path = "/scriptures/stories/play/overturned-tables";
const description = "Play as Jesus in Jerusalem. Cross the temple court, overturn the money tables and the dove sellers’ seats, and bar the passage.";
export const metadata: Metadata = {
  title, description, alternates: { canonical: path },
  openGraph: { title, description, url: path, type: "website", images: [{ url: templePainting, width: 1100, height: 855, alt: "El Greco’s Christ Cleansing the Temple" }] },
};

export default function OverturnedTablesPage() {
  return (
    <article data-temple-court="" className="court-page" aria-labelledby="temple-title">
      <header className="court-heading">
        <div className="court-location"><Link href="/scriptures/stories/play"><span aria-hidden="true">← </span>Playable stories</Link><span>Jerusalem · <Link href={markPassage}>Mark 11</Link></span></div>
        <h1 id="temple-title">{title}</h1>
      </header>
      <noscript><style>{".court-page .court-js{display:none}"}</style><p className="court-error">Enable JavaScript to play the courtyard. You can open the Gospel accounts below.</p></noscript>
      <TempleGame />
      <TempleReading />
    </article>
  );
}
