import type { MetadataRoute } from "next";
import { angelStories } from "@/lib/angel-stories";
import { EARLY_TEXTS, ERAS } from "@/lib/early/client";
import { getAllBeliefSystems } from "@/lib/evidence/afterlife";
import {
  ssgBookParams,
  ssgTopicIds,
  topicCanonicalPath,
} from "@/lib/scriptures/canonical";
import { WORLD_GUIDES } from "@/lib/world-guidance";
import canons from "../../public/scriptures/canons.json";

const BASE = "https://garovartabedian.com";

type Freq = "weekly" | "monthly" | "yearly";

/**
 * Every indexable route. The worlds (Scriptures / Jesus / The Apostles /
 * Early Writings / The Church / Angels / Who Owns the Word? / How We Know)
 * and their rooms
 * are enumerated here so crawlers reach them directly; tradition landings,
 * Writings eras, and each hosted early text come from the same data the pages
 * use, so they can't drift.
 * SSG book pages (tradition × book) and the 300 prerendered topic pages are
 * listed so crawlers find the reader; chapter URLs (~6680) are not — books
 * already link every chapter.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const entries: { path: string; priority: number; changeFrequency: Freq }[] = [
    // The front door and the worlds
    { path: "", priority: 1, changeFrequency: "weekly" },
    { path: "/scriptures", priority: 0.9, changeFrequency: "monthly" },
    { path: "/scriptures/search", priority: 0.7, changeFrequency: "monthly" },
    { path: "/scriptures/topics", priority: 0.7, changeFrequency: "monthly" },
    { path: "/scriptures/graph", priority: 0.8, changeFrequency: "monthly" },
    { path: "/scriptures/investigations/isaiah-53-clement-16", priority: 0.7, changeFrequency: "monthly" },
    { path: "/scriptures/parallels", priority: 0.8, changeFrequency: "monthly" },
    { path: "/scriptures/parallels/sacrifice-of-the-son", priority: 0.7, changeFrequency: "monthly" },
    { path: "/scriptures/parallels/adam-fall-and-iblis", priority: 0.7, changeFrequency: "monthly" },
    { path: "/scriptures/parallels/infancy-and-clay-birds", priority: 0.7, changeFrequency: "monthly" },
    { path: "/scriptures/parallels/the-golden-calf-and-samiri", priority: 0.7, changeFrequency: "monthly" },
    { path: "/scriptures/parallels/sanctity-of-human-life", priority: 0.7, changeFrequency: "monthly" },
    { path: "/scriptures/parallels/the-watchers", priority: 0.7, changeFrequency: "monthly" },
    { path: "/scriptures/parallels/jude-enoch-quotation", priority: 0.7, changeFrequency: "monthly" },
    { path: "/scriptures/parallels/son-of-man", priority: 0.7, changeFrequency: "monthly" },
    { path: "/jesus", priority: 0.9, changeFrequency: "monthly" },
    { path: "/jesus/words", priority: 0.7, changeFrequency: "monthly" },
    { path: "/jesus/life", priority: 0.7, changeFrequency: "monthly" },
    { path: "/jesus/risen", priority: 0.7, changeFrequency: "monthly" },
    { path: "/jesus/prophecy", priority: 0.7, changeFrequency: "monthly" },
    { path: "/jesus/history", priority: 0.7, changeFrequency: "monthly" },
    { path: "/jesus/history/belief-and-growth", priority: 0.65, changeFrequency: "monthly" },
    { path: "/jesus/lens", priority: 0.7, changeFrequency: "monthly" },
    { path: "/apostles", priority: 0.9, changeFrequency: "monthly" },
    { path: "/apostles/twelve", priority: 0.7, changeFrequency: "monthly" },
    { path: "/apostles/sent", priority: 0.7, changeFrequency: "monthly" },
    { path: "/early", priority: 0.9, changeFrequency: "monthly" },
    { path: "/early/ignatius", priority: 0.7, changeFrequency: "monthly" },
    ...WORLD_GUIDES.church.nav.map((item, index) => ({
      path: item.href,
      priority: index === 0 ? 0.9 : 0.7,
      changeFrequency: "monthly" as const,
    })),
    { path: "/angels", priority: 0.9, changeFrequency: "monthly" },
    { path: "/angels/stories", priority: 0.8, changeFrequency: "monthly" },
    ...angelStories.map(story => ({ path: `/angels/stories/${story.slug}`, priority: 0.8, changeFrequency: "monthly" as const })),
    { path: "/angels/fall", priority: 0.7, changeFrequency: "monthly" },
    { path: "/angels/encounters", priority: 0.7, changeFrequency: "monthly" },
    { path: "/angels/demons", priority: 0.7, changeFrequency: "monthly" },
    { path: "/angels/vocabulary", priority: 0.7, changeFrequency: "monthly" },
    { path: "/word", priority: 0.9, changeFrequency: "monthly" },
    { path: "/word/cases", priority: 0.7, changeFrequency: "monthly" },
    { path: "/word/free", priority: 0.7, changeFrequency: "monthly" },
    { path: "/evidence", priority: 0.9, changeFrequency: "monthly" },
    { path: "/evidence/frameworks", priority: 0.8, changeFrequency: "monthly" },
    { path: "/evidence/frameworks/compare", priority: 0.75, changeFrequency: "monthly" },
    { path: "/sources", priority: 0.6, changeFrequency: "monthly" },
    // About Garo — independent work first, employment kept as a secondary path
    { path: "/about", priority: 0.8, changeFrequency: "monthly" },
    { path: "/services", priority: 0.9, changeFrequency: "monthly" },
    { path: "/work", priority: 0.8, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.7, changeFrequency: "yearly" },
    { path: "/work/jobpilot", priority: 0.6, changeFrequency: "monthly" },
    { path: "/work/accessibility", priority: 0.6, changeFrequency: "monthly" },
    { path: "/work/garovartabedian", priority: 0.6, changeFrequency: "monthly" },
    { path: "/work/eye", priority: 0.6, changeFrequency: "monthly" },
    { path: "/hire", priority: 0.6, changeFrequency: "monthly" },
    { path: "/labs", priority: 0.5, changeFrequency: "monthly" },
    { path: "/resume", priority: 0.5, changeFrequency: "monthly" },
  ];

  // Each canon's landing page, straight from the data the shelves read.
  for (const t of canons.traditions) {
    entries.push({
      path: `/scriptures/${t.id}`,
      priority: 0.7,
      changeFrequency: "monthly",
    });
  }

  // SSG book pages — same tradition × book list as generateStaticParams.
  for (const { tradition, book } of ssgBookParams()) {
    entries.push({
      path: `/scriptures/${tradition}/${book}`,
      priority: 0.6,
      changeFrequency: "monthly",
    });
  }

  // The 300 prerendered topic pages — same list as generateStaticParams.
  for (const id of ssgTopicIds()) {
    entries.push({
      path: topicCanonicalPath(id),
      priority: 0.5,
      changeFrequency: "monthly",
    });
  }

  // Writings era landings — same ERAS list as /early and generateStaticParams.
  for (const era of ERAS) {
    entries.push({
      path: `/early/era/${era.id}`,
      priority: 0.65,
      changeFrequency: "monthly",
    });
  }

  // Every early Christian text we host.
  for (const t of EARLY_TEXTS) {
    entries.push({
      path: `/early/${t.id}`,
      priority: 0.6,
      changeFrequency: "yearly",
    });
  }

  // 54 World Traditions in the Afterlife Atlas
  for (const b of getAllBeliefSystems()) {
    entries.push({
      path: `/evidence/frameworks/${b.id}`,
      priority: 0.6,
      changeFrequency: "monthly",
    });
  }

  return entries.map((e) => ({
    url: `${BASE}${e.path}`,
    lastModified,
    changeFrequency: e.changeFrequency,
    priority: e.priority,
  }));
}
