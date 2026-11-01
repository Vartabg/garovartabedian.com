import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    // `**/` matters: agent worktrees under .claude/ carry their own .next
    // build output, and a bare `.next/**` only ignores the one at the root —
    // so a stray worktree turns `npm run lint` into hundreds of errors in
    // generated vendor chunks. Both paths are gitignored, so CI never saw it.
    ignores: [
      "**/.next/**",
      "**/.vercel/**",
      "**/node_modules/**",
      ".claude/**",
      // Vendored onnxruntime-web loader served for the in-browser semantic search.
      "public/ort/**",
      // Unmodified BSD-licensed MapLibre worker and its shared runtime.
      "public/vendor/maplibre-gl/**",
      "test-results/**",
      "playwright-report/**",
      "next-env.d.ts",
    ],
  },
  ...nextVitals,
  ...nextTypescript,
  {
    // Next 16 adds React Compiler diagnostics to the recommended hooks rules.
    // These existing components predate that migration. Keep their diagnostics
    // visible while migrating them separately; do not weaken rules-of-hooks or
    // exhaustive-deps. New components retain the recommended error severity.
    name: "legacy/react-effects-migration",
    files: [
      "src/app/_components/AccessibilityMenu.tsx",
      "src/app/_components/FindOverlay.tsx",
      "src/app/_components/FindPreview.tsx",
      "src/app/_components/MeaningRail.tsx",
      "src/app/_components/NotFoundScripture.tsx",
      "src/app/_components/OriginalLine.tsx",
      "src/app/_components/ResonanceRadar.tsx",
      "src/app/_components/WorldSwitcher.tsx",
      "src/app/_components/reading/useReadingPreferences.ts",
      "src/app/apostles/stories/StoryReflections.tsx",
      "src/app/church/tree/Tree.tsx",
      "src/app/early/EarlyCatalog.tsx",
      "src/app/evidence/frameworks/AfterlifeExplorer.tsx",
      "src/app/jesus/_components/SynopticComparator.tsx",
      "src/app/jesus/_components/life-lenses/LifeLenses.tsx",
      "src/app/jesus/life/ImmersiveHolyLandMap.tsx",
      "src/app/jesus/life/LifeMapExperience.tsx",
      "src/app/scriptures/\\[tradition\\]/\\[book\\]/\\[chapter\\]/ReaderClient.tsx",
      "src/app/scriptures/\\[tradition\\]/\\[book\\]/\\[chapter\\]/VersePanel.tsx",
      "src/app/scriptures/\\[tradition\\]/\\[book\\]/\\[chapter\\]/WordBridge.tsx",
      "src/app/scriptures/_components/ContinueCard.tsx",
      "src/app/scriptures/_components/doorways/Doorways.tsx",
      "src/app/scriptures/find/Explorer.tsx",
      "src/app/scriptures/graph/ScripturePathTracer.tsx",
      "src/app/scriptures/read/isaiah-53-clement-16/ReadingPath.tsx",
      "src/app/scriptures/research/ResearchWorkspace.tsx",
      "src/app/scriptures/search/PublicAssessment.tsx",
      "src/app/scriptures/search/SearchRoom.tsx",
      "src/app/word/WordLedger.tsx",
      "src/lib/early/use-library-search.ts",
      "src/lib/i18n/context.tsx",
    ],
    rules: { "react-hooks/set-state-in-effect": "warn" },
  },
  {
    name: "legacy/react-refs-migration",
    files: ["src/app/_components/FindOverlay.tsx"],
    rules: { "react-hooks/refs": "warn" },
  },
  {
    name: "legacy/react-immutability-migration",
    files: [
      "src/app/_components/WorldGuide.tsx",
      "src/app/scriptures/_components/doorways/ChapterBars.tsx",
    ],
    rules: { "react-hooks/immutability": "warn" },
  },
  {
    name: "legacy/react-memoization-migration",
    files: ["src/app/scriptures/find/Explorer.tsx"],
    rules: { "react-hooks/preserve-manual-memoization": "warn" },
  },
];

export default eslintConfig;
