/** Shared server entry point; each dataset has one validated loader. */
export { canons, isTranslationId, pickTranslation, traditionFor } from "./server/canons";
export { getBookText } from "./server/book-text";
export { getChapterGuide, getChapterNeighbours } from "./server/guides";
export { getBookBriefing } from "./server/book-briefings";
export { getTraditionBriefing } from "./server/tradition-briefings";
export { naveIndex } from "./server/nave-index";
export { getNaveTopic, topicTitle } from "./server/nave";
export { getOriginalChapter } from "./server/originals";
export {
  originalManifest,
  hasOriginalChapter,
} from "./original-availability";
