import type { Metadata } from "next";
import Link from "next/link";
import ValleyGame from "./ValleyGame";
import ValleyReading, { davidIllustration, samuelPassage } from "./ValleyReading";
import "./elah.css";

const title = "The Valley of Elah";
const path = "/scriptures/stories/play/valley-of-elah";
const description = "Play as David in the Valley of Elah. Set aside Saul’s bronze armor, choose five smooth stones from the brook, and face Goliath.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: path },
  openGraph: {
    title,
    description,
    url: path,
    type: "website",
    images: [
      {
        url: davidIllustration,
        width: 880,
        height: 660,
        alt: "David standing with a shepherd’s staff and sling in the Valley of Elah",
      },
    ],
  },
};

export default function ValleyOfElahPage() {
  return (
    <article data-valley-of-elah="" className="elah-page" aria-labelledby="elah-title">
      <header className="elah-heading">
        <div className="elah-location">
          <Link href="/scriptures/stories/play">
            <span aria-hidden="true">← </span>Playable stories
          </Link>
          <span>
            Valley of Elah · <Link href={samuelPassage}>1 Samuel 17</Link>
          </span>
        </div>
        <h1 id="elah-title">{title}</h1>
      </header>
      <noscript>
        <style>{".elah-page .elah-js{display:none}"}</style>
        <p className="elah-error">
          Enable JavaScript to play the Valley of Elah. You can open 1 Samuel 17 below.
        </p>
      </noscript>
      <ValleyGame />
      <ValleyReading />
    </article>
  );
}
