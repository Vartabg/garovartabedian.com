"use client";

import Link from "next/link";
import type { FacesData } from "@/lib/church/types";
import ArtPlate from "@/app/_components/ArtPlate";
import GlossText from "@/app/_components/GlossText";
import ChurchDiveList from "../ChurchDiveList";
import ChurchSectionNav from "../ChurchSectionNav";

function FacesMap({ data }: { data: FacesData }) {
  return (
    <nav className="ch-face-map" aria-label="Faces by culture">
      <div className="world-tool-head">
        <strong>Cultures represented</strong>
        <span>{data.faces.reduce((sum, face) => sum + face.art.length, 0)} public-domain artworks</span>
      </div>
      <div className="ch-face-nodes">
        {data.faces.map((face) => (
          <a key={face.id} href={`#${face.id}`} className="ch-face-node">
            <span className="ch-face-mark" aria-hidden="true" />
            <strong>{face.culture}</strong>
            <span>{face.name}</span>
            <em>{face.years}</em>
          </a>
        ))}
      </div>
    </nav>
  );
}

export default function FacesRoom({ data }: { data: FacesData }) {
  // Glossary: dot a foreign term once per page visit.
  const glossSeen = new Map<string, string>();
  const faceLinks = data.faces.map((face) => ({
    id: face.id,
    label: face.name,
  }));

  return (
    <>
      <p className="kicker">
        <Link href="/church">The Church</Link>
      </p>
      <h1>The faces.</h1>
      <p className="lede">
        The road and the tree show the shape of the whole. This is a handful
        of the real people behind it — one face per culture, with the art
        their tradition actually made, and where that tradition stands today.
      </p>

      <FacesMap data={data} />
      <ChurchSectionNav
        label="Faces on this page"
        items={faceLinks}
      />

      <ChurchDiveList
        id="face-records"
        label="Faces"
        countLabel={`${data.faces.length} cultural records`}
        description="Scan the person and tradition; open a record for the story, living church, quotation, and art."
      >
        {data.faces.map((f) => (
          <details className="ch-dive ch-face" key={f.id} id={f.id} data-church-dive>
            <summary className="ch-dive-summary">
              <span className="ch-face-culture">{f.culture}</span>
              <h2>{f.name}</h2>
              <span className="ch-face-years">{f.years}</span>
              <span className="ch-dive-subline">
                Story + living tradition
                {f.art.length > 0
                  ? ` + ${f.art.length} public-domain artwork${f.art.length === 1 ? "" : "s"}`
                  : ""}
              </span>
              <span className="ch-dive-prompt">
                <span className="ch-dive-open-label">Open the cultural record</span>
                <span className="ch-dive-close-label">Close the cultural record</span>
              </span>
            </summary>
            <div className="ch-dive-body">
              <div>
                {f.quote && (
                  <blockquote>
                    &ldquo;
                    <GlossText text={f.quote.text} seen={glossSeen} />
                    &rdquo;
                    <footer className="ch-face-years">
                      {" — "}
                      <a href={f.quote.sourceUrl} target="_blank" rel="noopener noreferrer" className="textlink">
                        {f.quote.cite}
                      </a>
                    </footer>
                  </blockquote>
                )}
                <p>
                  <GlossText text={f.line} seen={glossSeen} />
                </p>
                <p className="ch-face-today">
                  <strong>Today: </strong>
                  <GlossText text={f.today} seen={glossSeen} />
                </p>
              </div>
              {f.art.length > 0 && (
                <div className="ch-face-art">
                  {f.art.map((w) => (
                    <ArtPlate
                      key={w.id}
                      src={w.imageUrl}
                      alt={w.alt ?? `${w.title}, ${w.date} — ${w.medium}, ${w.museum}`}
                      title={w.title}
                      sub={w.date}
                      museum={w.museum}
                      objectUrl={w.objectUrl}
                    />
                  ))}
                </div>
              )}
            </div>
          </details>
        ))}
      </ChurchDiveList>
    </>
  );
}
