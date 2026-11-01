# Scriptures access and study flow

User authorization: fix Word Bridge access and comparison metadata first, then align Scriptures with the redesigned homepage, deploy, and verify the actual visitor path before drafting promotion.

Base: origin/master cf796510. Preserve its shared navigation, StudyPageHeader, quiet reader, and unrestricted passage/edition picker.

## Work units

1. Word Bridge: named public entrance and visible chapter-reader action; deliberate, shareable open-verse state; WEB handoff; loading, retry, unsupported, and edition-gap states. Keep ordinary verse links unchanged.
2. Parallel witness metadata: separate worker/branch owns passage-specific metadata, generated data, validation, and digest coverage. Preserve excerpts and rights; omit unsupported assertions. Integrate through audited PR.
3. Scriptures discovery: build the hub's task entrances/directory from canonical public routes, use stable names, and extend the existing homepage discovery catalog for Word Bridge. Keep direct reading first.
4. Study transitions: validate passage context and carry it into tools that genuinely support it; show a return-to-passage context for curated tools rather than pretending arbitrary selections are supported.
5. Edition-aware counts: correct shelf/matrix labels and links without confusing traditional enumeration with hosted records. Align remaining tool presentation/landmarks with existing shared components.

## Acceptance

- Homepage and Scripture hub reveal Word Bridge by name.
- A visitor selects a reference and reaches a visible, functioning Word Bridge; no knowledge of the verse-number shortcut required.
- Shared/reloaded bridge URLs open the requested verse and show edition truth. KJV offers a direct WEB transition. Unsupported passages and failed requests have distinct visible outcomes and recovery.
- Matthew, Mark, Luke, and John each work from the public entrance; dictionary/grammar and review indicators remain truthful.
- Current passage is retained across supported comparison/research transitions and a return to reading. Invalid input remains internal, bounded, and understandable.
- Corrected witness facts and edition/count labels match the passage/edition; metadata enters integrity verification.
- Keyboard, narrow phone, enlarged text, themes, reduced motion, and no-storage states work. The ordinary study path does not load the semantic model.

## Verification and shipping

Use Node24. Run focused regression checks while implementing, then required lint/type/unit/smoke/build/browser/accessibility gates. Use system Chrome and managed previews. Obtain an independent review of the final diff. Finish each feature branch through agent-task finish and its secret/history scans; merge via PR, never push master directly. Respect any existing release and check master before promotion. After production completion, verify the homepage-to-tool path on the public site and save screenshots and a verification receipt. Draft no post before that succeeds.
