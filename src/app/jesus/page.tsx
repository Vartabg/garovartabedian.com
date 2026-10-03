import type { Metadata } from "next";
import WorldHomeHero from "../_components/WorldHomeHero";
import JesusJourney from "./JesusJourney";

export const metadata: Metadata = {
  title: "The person himself",
};

export default function JesusHome() {
  return (
    <>
      <WorldHomeHero
        world="jesus"
        eyebrow="Jesus Christ"
        title="The person himself."
        facets={["Words in context", "Life on the map", "History with boundaries"]}
      >
        Not a lecture — a place to look for yourself. His recorded words, a map
        of his life, prophecy read beside later claims, the earliest witnesses,
        and the views that followed. Read the source, see the boundary, weigh
        the claim. One path leads through all of it, and it ends where you
        decide.
      </WorldHomeHero>

      <JesusJourney />
    </>
  );
}
