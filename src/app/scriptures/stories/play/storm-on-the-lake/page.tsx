import type { Metadata } from "next";
import Link from "next/link";
import StormReading, { markPassage, stormPainting } from "./StormReading";
import StormStage from "./StormStage";
import "./storm.css";

const title = "The storm on the lake";
const path = "/scriptures/stories/play/storm-on-the-lake";
const description = "Cross the Sea of Galilee at dusk in a cedar fishing boat, fight the rising squall, and wake Jesus in the stern.";

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
        url: stormPainting,
        width: 1280,
        height: 720,
        alt: "Jesus standing in the stern of a wooden fishing boat on the Sea of Galilee, rebuking the wind and waves.",
      },
    ],
  },
};

export default function StormOnTheLakePage() {
  return (
    <article data-storm-lake="" className="storm-page" aria-labelledby="storm-title">
      <header className="storm-heading">
        <div className="storm-location">
          <Link href="/scriptures/stories/play">
            <span aria-hidden="true">← </span>Playable stories
          </Link>
          <span>
            Sea of Galilee · <Link href={markPassage}>Mark 4</Link>
          </span>
        </div>
        <h1 id="storm-title">{title}</h1>
      </header>
      <noscript>
        <style>{".storm-page .storm-js{display:none}"}</style>
        <p className="storm-error">
          Enable JavaScript to sail across the lake. You can open the Gospel accounts below.
        </p>
      </noscript>
      <StormStage />
      <StormReading />
    </article>
  );
}
