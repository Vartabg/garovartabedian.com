import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import graph from "../../../../public/scriptures/graph/graph.json";
import canonsData from "../../../../public/scriptures/canons.json";
import type { Canons } from "@/lib/scriptures/types";
import type { IconicPath } from "@/lib/scriptures/graph-tracer";
import { ScripturePathTracer } from "./ScripturePathTracer";
import BookConnectionMap from "./BookConnectionMap";
import ThreadBrowser from "./ThreadBrowser";

type GraphData = {
  meta: {
    generatedAt: string;
    algorithms: Record<string, string>;
    determinism: string;
    stats: {
      verses: number;
      distinctEdges: number;
      edgeMass: number;
      pageRankScoreSum: number;
      connectedComponents: number;
      threadCount: number;
    };
  };
  centrality: Array<{
    rank: number;
    ref: string;
    href: string;
    score: number;
    inDegree: number;
    outDegree: number;
  }>;
  flows: Array<{ from: string; fromName: string; to: string; toName: string; citations: number }>;
  threads: Array<{
    from: string;
    to: string;
    hops: number;
    chain: Array<{ ref: string; href: string }>;
  }>;
  iconicPaths?: IconicPath[];
};

const data = graph as GraphData;
const canons = canonsData as Canons;

export const metadata: Metadata = {
  title: "The cross-reference graph",
  description:
    "Explore PageRank centrality, book-to-book reference flows, and bounded paths computed over the site's curated cross-reference graph.",
};

const fmt = (n: number) => n.toLocaleString("en-US");

export default function GraphPage() {
  const { meta, centrality, flows, threads, iconicPaths = [] } = data;
  const top = centrality.slice(0, 25);

  return (
    <div className="scr-graph">
      <p className="kicker">Scriptures · computed, not generated</p>
      <h1>The cross-reference graph</h1>
      <p className="lede">
        Explore the connections between books, then follow a path from one verse
        to another. Built from {fmt(meta.stats.verses)} indexed verses and{" "}
        {fmt(meta.stats.distinctEdges)} distinct cross-reference links. Open the
        passages to judge each connection in context.
      </p>

      <BookConnectionMap flows={flows} />

      <Suspense fallback={<div className="scr-meta">Loading Scripture Path Tracer…</div>}>
        <ScripturePathTracer canons={canons} iconicPaths={iconicPaths} />
      </Suspense>

      <section aria-labelledby="graph-method">
        <h2 id="graph-method">Method</h2>
        <dl className="scr-graph-method">
          {Object.entries(meta.algorithms).map(([name, description]) => (
            <div key={name} className="scr-graph-method-item">
              <dt>{name}</dt>
              <dd>{description}</dd>
            </div>
          ))}
        </dl>
        <p>
          When links are treated as traversable in either direction, the indexed
          verse graph forms {meta.stats.connectedComponents} connected component.
          That means every indexed node can be reached from every other node; it
          does not rule out smaller communities within the graph.
        </p>
      </section>

      <section aria-labelledby="graph-centrality">
        <h2 id="graph-centrality">Structurally central verses</h2>
        <p>
          PageRank over the directed citation graph. A verse scores high when
          highly connected verses point to it. The score describes position in
          this reference dataset, not theological importance.
        </p>
        <div className="scr-graph-table-wrap">
          <table>
            <caption className="sr-only">
              Most central verses by PageRank over the cross-reference graph
            </caption>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Verse</th>
                <th scope="col" className="num">
                  Score
                </th>
                <th scope="col" className="num">
                  Cited by
                </th>
                <th scope="col" className="num">
                  Cites
                </th>
              </tr>
            </thead>
            <tbody>
              {top.map((verse) => (
                <tr key={verse.rank}>
                  <td className="num">{verse.rank}</td>
                  <td>
                    <Link href={verse.href}>{verse.ref}</Link>
                  </td>
                  <td className="num">{verse.score.toFixed(6)}</td>
                  <td className="num">{fmt(verse.inDegree)}</td>
                  <td className="num">{fmt(verse.outDegree)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="graph-threads">
        <h2 id="graph-threads">Threads through the hubs</h2>
        <p>
          Shortest paths between each book&rsquo;s most central verse, relayed
          only through the 1,000 most central verses. Each hop follows a stored
          cross-reference link, which this path view can traverse in either
          direction.
        </p>
        <ThreadBrowser threads={threads} total={meta.stats.threadCount} />
      </section>

      <footer className="scr-graph-footer">
        <p>
          Computed {meta.generatedAt.slice(0, 10)} from{" "}
          <code>public/scriptures/xref</code>. Parameters and determinism notes
          ship inside <code>public/scriptures/graph/graph.json</code>.
        </p>
      </footer>
    </div>
  );
}
