import type { Metadata } from "next";
import { loadReadingJourney } from "@/lib/evidence/reading-journey-server";
import ReadingPath from "./ReadingPath";

export const metadata: Metadata = {
  title: "Wounds, healing, and humility — A reading path",
  description: "Read Isaiah 53 and 1 Clement 16 in their hosted English editions, then trace the connection with nearby source notes.",
  robots: { index: false, follow: true },
};

export default async function ReadingPathPage() {
  return <ReadingPath journey={await loadReadingJourney()} assessmentsEnabled={process.env.FIND_PUBLIC_ENABLED === "1"} />;
}
