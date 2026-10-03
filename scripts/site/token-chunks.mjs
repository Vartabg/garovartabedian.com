/** Exact UTF-16 spans in normalized source text; every emitted input is token checked. */
export function chunkText(text, countTokens, { maxTokens = 384, overlapTokens = 48, specialTokens = 2 } = {}) {
  if (!Number.isInteger(maxTokens) || maxTokens < 8 || !Number.isInteger(overlapTokens) || overlapTokens < 0 || !Number.isInteger(specialTokens) || specialTokens < 0 || overlapTokens + specialTokens >= maxTokens) {
    throw new Error("Invalid chunk token budget");
  }
  if (!text.length) return [];
  const offsets = [0];
  for (const character of text) offsets.push(offsets.at(-1) + character.length);
  const positions = new Map(offsets.map((offset, index) => [offset, index]));
  const count = (start, end) => countTokens(text.slice(offsets[start], offsets[end]));
  const result = [];
  let start = 0;
  while (start < offsets.length - 1) {
    let lo = start + 1, hi = offsets.length - 1, end = start;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (count(start, mid) <= maxTokens) { end = mid; lo = mid + 1; }
      else hi = mid - 1;
    }
    if (end === start) throw new Error("A single character exceeds the token budget");
    if (end < offsets.length - 1) {
      const boundary = text.lastIndexOf(" ", offsets[end] - 1) + 1;
      if (boundary > offsets[start]) end = positions.get(boundary);
    }
    const content = text.slice(offsets[start], offsets[end]);
    const tokens = countTokens(content);
    if (tokens > maxTokens) throw new Error("Chunk exceeded token budget after boundary adjustment");
    result.push({ start: offsets[start], end: offsets[end], tokens, text: content });
    if (end === offsets.length - 1) break;
    if (!overlapTokens) { start = end; continue; }
    lo = start + 1; hi = end;
    let next = end;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (count(mid, end) <= overlapTokens + specialTokens) { next = mid; hi = mid - 1; }
      else lo = mid + 1;
    }
    const boundary = text.indexOf(" ", offsets[next]) + 1;
    if (boundary > offsets[next] && boundary <= offsets[end]) next = positions.get(boundary);
    start = next;
  }
  return result;
}
