export const BOOK_ID_RE = /^[1-4]?[A-Z0-9]{2,5}$/;
export const TOPIC_SECTION_RE = /^[A-Z]$/;
export const TRADITION_ID_RE = /^[a-z][a-z-]{1,30}$/;

export function safeIdentifier(value: string, pattern: RegExp): string | null {
  return pattern.test(value) ? value : null;
}
