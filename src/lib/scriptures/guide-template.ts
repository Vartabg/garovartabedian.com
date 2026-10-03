/**
 * Template-boilerplate signatures from the v1 guide generator, mirrored from
 * scripts/scriptures/guide-validation.mjs. The unit test
 * tests/scripture-guide-template.test.ts keeps the two lists in sync.
 */
export const GUIDE_TEMPLATE_SIGNATURES: readonly RegExp[] = [
  /\(\d+ verses\) continues the story of/i,
  /for a first-time reader, it answers: who is god in this moment/i,
  /this placeholder will be replaced/i,
  /the guide will be replaced/i,
  /what is happening in .+ \d+\?/i,
  /read the summary above, then note who is speaking/i,
];

/** True when a guide still carries v1 generator boilerplate. */
export const isTemplateGuide = (guide: unknown): boolean => {
  if (typeof guide === "string") {
    // Match individual text values so .+ cannot span JSON fields. Keep the
    // validator's existing escaping behavior for text within a single value.
    const text = JSON.stringify(guide);
    return GUIDE_TEMPLATE_SIGNATURES.some((signature) => signature.test(text));
  }
  return guide !== null && typeof guide === "object"
    ? Object.values(guide).some(isTemplateGuide)
    : false;
};
