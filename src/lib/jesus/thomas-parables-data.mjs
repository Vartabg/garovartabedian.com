/** Validate the source selection before rendering, tracing, or releasing it. */
export function validateThomasParables(value) {
  const expected = new Map([
    ["thomas-children-in-field", 21],
    ["thomas-empty-jar", 97],
    ["thomas-assassin", 98],
    ["thomas-lion-human", 7],
    ["thomas-five-trees", 19],
    ["thomas-brother-eye", 25],
    ["thomas-world-corpse", 56],
    ["thomas-samaritan-lamb", 60],
    ["thomas-bringing-forth", 70],
    ["thomas-empty-well", 74],
    ["thomas-light-wood-stone", 77],
    ["thomas-world-body", 80],
    ["thomas-likeness-images", 84],
    ["thomas-body-soul", 87],
    ["thomas-father-mother", 101],
    ["thomas-drinking-mouth", 108],
    ["thomas-flesh-soul", 112],
  ]);
  if (!Array.isArray(value) || value.length !== expected.size) throw new Error("Invalid Thomas-only saying inventory.");
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
