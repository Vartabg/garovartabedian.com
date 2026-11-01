import type { Metadata } from "next";
import Link from "next/link";
import lifeLenses from "../../../public/jesus/life-lenses.json";
import type { LifeLensesIndex } from "@/lib/jesus/life-lenses";
import LifeLenses from "./_components/life-lenses/LifeLenses";

export const metadata: Metadata = {
  title: "The person himself",
};

const data = lifeLenses as LifeLensesIndex;

/** The rooms, under names a reader recognizes. */
const MORE_WAYS = [
  { href: "/jesus/words", label: "All his words" },
  { href: "/jesus/parables", label: "Parables" },
  { href: "/jesus/life", label: "The full map" },
  { href: "/jesus/harmony", label: "Gospels word by word" },
  { href: "/jesus/prophecy", label: "Prophecy" },
  { href: "/jesus/risen", label: "Cross to ascension" },
  { href: "/jesus/history", label: "History" },
  { href: "/jesus/lens", label: "How the world sees him" },
  { href: "/jesus/dossier", label: "Research worksheets" },
];

/**
 * The Jesus world opens on his life: forty moments the visitor chooses from,
 * each seen through his words, the four Gospels and prophecy. It replaced a
 * guided six-stop path (Garo, 2026-10-04: "build it", from the mockup).
 */
export default function JesusHome() {
  return (
    <div className="jl-home">
      <header className="jl-head">
        <p className="jl-eyebrow">Jesus Christ</p>
        <h1 data-hand="capitals">The person himself.</h1>
      </header>
      <LifeLenses data={data} />
      <nav className="jl-more" aria-labelledby="jl-more-title">
        <h2 id="jl-more-title">More ways in</h2>
        <ul>
          {MORE_WAYS.map((way) => (
            <li key={way.href}>
              <Link href={way.href}>{way.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
