import { parseStudyContext, type StudySearchParams } from "../study-context";
import { getBookText } from "./book-text";

export async function resolveStudyContext(params: StudySearchParams) {
  const parsed = parseStudyContext(params);
  if (!parsed.context) return { ...parsed, sourceText: null };
  const context = parsed.context;
  const text = await getBookText(context.translation, context.bookId);
  const sourceText = text?.chapters[context.chapter - 1]?.[(context.verse ?? 1) - 1]?.trim();
  if (!sourceText) return { context: null, sourceText: null,
    error: "This verse has no hosted text in the selected edition. Return to the reader and choose another verse." };
  return { context, sourceText, error: null };
}
