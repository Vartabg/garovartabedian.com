import Link from "next/link";
import { GlossSegments } from "../_components/Gloss";
import RefLinks from "./RefLinks";
import ApostlesStoryPlate from "./ApostlesStoryPlate";
import { APOSTLES_STORY_PLATES } from "@/lib/apostles/story-plates";
import { refHref } from "@/lib/apostles/client";
import { segmentText } from "@/lib/glossary/segment";
import type { TwelveData } from "@/lib/apostles/types";

export default function ApostlesSources({ data }: { data: TwelveData }) {
  const glossSeen = new Map<string, string>();
  return <div id="apostles-sources" className="ap-home-sources">
      <blockquote className="ap-precedent">
        &ldquo;{data.precedent.text}&rdquo;
        <p>{data.precedent.note}</p>
        <footer className="ap-cite">— {data.precedent.cite}</footer>
      </blockquote>

      <section className="ap-lists" aria-labelledby="rollcalls-title">
        <h2 id="rollcalls-title">The four roll-calls</h2>
        <p>
          <GlossSegments segments={segmentText(data.listsNote, glossSeen)} />
        </p>
        <div className="ap-lists-grid">
          {data.lists.map((list) => (
            <ol className="ap-list" key={list.id} aria-label={`The twelve as listed in ${list.cite.label}`}>
              <li className="ap-list-head">
                <Link href={refHref(list.cite.ref)} className="textlink">
                  {list.cite.label}
                </Link>
                <span>{list.note}</span>
              </li>
              {list.names.map((name) => (
                <li key={name}>{name}</li>
              ))}
              {list.names.length === 11 && <li className="ap-list-empty">— the empty seat —</li>}
            </ol>
          ))}
        </div>
      </section>

      <section className="ap-shape" aria-labelledby="shape-title">
        <h2 id="shape-title">The shape of the band</h2>
        <ApostlesStoryPlate plate={APOSTLES_STORY_PLATES.call} />
        <ul className="ap-shape-rows">
          <li>
            <strong>Four fishermen</strong>
            <span>
              Peter, Andrew, James, John — two pairs of brothers, called from
              their nets.
            </span>
          </li>
          <li>
            <strong>A tax collector and a zealot</strong>
            <span>
              Matthew is called from a tax booth. Simon is named the Zealot.
              Their names appear in the same apostolic lists; those lists do not
              explain Simon&rsquo;s earlier political commitments.
            </span>
          </li>
          <li>
            <strong>Different voices, uneven records</strong>
            <span>
              Philip, Bartholomew, Thomas, James of Alphaeus, Thaddaeus — their records vary greatly in length. Thomas&rsquo;s includes
              &ldquo;my Lord and my God.&rdquo;
            </span>
          </li>
          <li>
            <strong>One traitor, one replacement</strong>
            <span>
              Judas ends at a field called Blood; Matthias fills the seat; Acts does not narrate his later work. Both records are kept whole.
            </span>
          </li>
        </ul>
      </section>

      <blockquote className="ap-paul">
        <p>
          <GlossSegments segments={segmentText(data.paul.text, glossSeen)} />
        </p>
        <footer className="ap-cite">
          <RefLinks refs={data.paul.refs} />
        </footer>
      </blockquote>

  </div>;
}
