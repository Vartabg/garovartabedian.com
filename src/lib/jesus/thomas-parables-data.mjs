/** Validate the source selection before rendering, tracing, or releasing it. */
export function validateThomasParables(value) {
  const expected = new Map([
    ["thomas-children-in-field", 21],
    ["thomas-empty-jar", 97],
    ["thomas-assassin", 98],
  ]);
  if (!Array.isArray(value) || value.length !== expected.size) throw new Error("Invalid Thomas-only parables: expected three stories.");
  const seen = new Set();
  for (const entry of value) {
    if (!entry || typeof entry !== "object" || typeof entry.id !== "string" ||
        !expected.has(entry.id) || expected.get(entry.id) !== entry.saying || seen.has(entry.id) ||
        typeof entry.title !== "string" || !entry.title.trim() ||
        (entry.note !== undefined && (typeof entry.note !== "string" || !entry.note.trim()))) {
      throw new Error("Invalid Thomas-only parable metadata.");
    }
    if (entry.saying === 21 && (typeof entry.note !== "string" || !/thief/i.test(entry.note) || !/harvest/i.test(entry.note))) {
      throw new Error("Thomas saying 21 must identify the thief and harvest material.");
    }
    seen.add(entry.id);
  }
  return value;
}
