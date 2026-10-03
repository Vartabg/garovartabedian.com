import Image from "next/image";
import type { ReactNode } from "react";
import { WORLD_BY_ID, type WorldId } from "@/lib/world-registry";
import Breathe from "./Breathe";

/** What each world's plate shows — the caption set under the frame. */
const WORLD_PLATE_CAPTION: Record<WorldId, string> = {
  scriptures:
    "Open manuscript codices on a candlelit study table, joined by faint threads of light.",
  jesus:
    "The stone rolled away from an open garden tomb at dawn, folded linen resting on the rock.",
  apostles:
    "Twelve paths of light scattering from one radiant point across a dark field.",
  early:
    "Papyrus writings on a lamplit work table beneath a map of the Mediterranean.",
  church:
    "A branching church-history tree drawn across a table with small buildings marking its traditions.",
  angels:
    "Vast geometric wings of light flanking a radiant stair above cracked dark stone.",
  word:
    "An open Bible separated from sealed papers by a brass fence.",
  evidence:
    "A telescope, manuscript, archaeological stone, prism, and balance share a research table at the edge of dawn.",
};

/**
 * A world's threshold, laid out like a leaf: the copy on the world's own
 * ground, the image beside it as a framed plate with its caption. No
 * full-screen render, no shade over the words, no glass. The plate takes the
 * shared treatment from core.css — ink on vellum by day, a lit print by
 * lamplight — so every world opens in one hand and differs by its ink.
 */
export default function WorldHomeHero({
  world,
  eyebrow,
  title,
  children,
  facets,
  actions,
}: {
  world: WorldId;
  eyebrow: string;
  title: string;
  children: ReactNode;
  facets: string[];
  actions?: ReactNode;
}) {
  const config = WORLD_BY_ID[world];

  return (
    <section
      className="world-home-hero"
      data-world={world}
      aria-labelledby={`${world}-world-title`}
    >
      <div className="world-home-hero-copy">
        <p className="world-home-hero-eyebrow">{eyebrow}</p>
        <h1 id={`${world}-world-title`}>
          <Breathe text={title} />
        </h1>
        <div className="world-home-hero-lede">{children}</div>

        {actions}

        {facets.length > 0 && (
          <ul className="world-home-hero-facets" aria-label="What this world contains">
            {facets.map((facet) => (
              <li key={facet}>{facet}</li>
            ))}
          </ul>
        )}
      </div>

      <figure className="world-home-hero-plate plate">
        <span className="plate-frame">
          {/* The caption carries the description, so the image is
              presentational to assistive technology — one reading, not two. */}
          <Image
            className="world-home-hero-art"
            src={config.image}
            alt=""
            fill
            priority
            sizes="(min-width: 900px) 34rem, 100vw"
          />
        </span>
        <figcaption>{WORLD_PLATE_CAPTION[world]}</figcaption>
      </figure>
    </section>
  );
}
