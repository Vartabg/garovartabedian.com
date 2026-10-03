/** Public evidence: Vartabg/accessibility-is-a-product-feature, September 2026. */
export const ACCESSIBILITY_CASE_STUDY = {
  title: "Accessibility is a product feature",
  description: "A four-product accessibility pass: keyboard access, semantic alternatives, reading preferences, and release checks that fail when the scan fails.",
  lede: "Who gets left out when a product only works one way? This work follows that question through four different products, then shares the repairs and the standard behind them.",
  purpose: "Love of neighbor reaches into practical details: whether someone can read the page, operate its controls, understand what changed, and participate. Accessibility belongs in the product definition.",
  source: "https://github.com/Vartabg/accessibility-is-a-product-feature",
  checklist: "https://github.com/Vartabg/accessibility-is-a-product-feature/blob/main/ACCESSIBILITY_CHECKLIST.md",
  products: [
    { name: "Portfolio", change: "Clearer link affordances, first-render translations, and keyboard-sized church-history navigation.", evidence: "Representative routes checked with Axe and Lighthouse; checks enforced in CI.", href: "/" },
    { name: "ATXBro", change: "A skip target, persisted reading choices, reduced motion, higher contrast, and clearer field names and targets.", evidence: "Product tests, a production build, and rendered accessibility checks.", href: "https://www.atxbro.com" },
    { name: "JobPilot", change: "Semantic job cards, labeled fields, contextual action names, and live status messages.", evidence: "Accessibility contracts included in the application's test suite.", href: "/work/jobpilot" },
    { name: "EYE", change: "Dialog focus handling, tab semantics, keyboard-operable nodes, and text alternatives for visual service graphs.", evidence: "Static and rendered accessibility contracts alongside the production build.", href: "/work/eye" },
  ],
  limits: "These are documented repairs and representative checks, not a certification or a claim that every barrier has been removed. Automation cannot judge whether an explanation makes sense or a workflow is exhausting. Keyboard, screen-reader, zoom, contrast, motion, and mobile checks remain part of release review.",
} as const;
