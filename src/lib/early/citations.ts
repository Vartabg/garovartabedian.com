/** Chapter numbers identify passages; array positions only identify storage slots. */
export function chapterNumber(heading?: string): number | undefined {
  const token = /^Chapter\s+(\d+|[IVXLCDM]+)(?=[.\s—–:-]|$)/i.exec(heading ?? "")?.[1];
  if (!token) return undefined;
  if (/^\d+$/.test(token)) {
    const number = Number(token);
    return Number.isSafeInteger(number) && number > 0 ? number : undefined;
  }
  const roman = token.toUpperCase();
  if (!/^(?=.)M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/.test(roman)) {
    return undefined;
  }
  const values: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  return [...roman].reduce((total, char, index) => {
    const value = values[char];
    return total + (value < (values[roman[index + 1]] ?? 0) ? -value : value);
  }, 0);
}

/** Do not manufacture a citation when a text has repeated chapter numbering. */
export function chapterAnchors(sections: { heading?: string }[]): (string | undefined)[] {
  const numbers = sections.map((section) => chapterNumber(section.heading));
  const counts = new Map<number, number>();
  for (const number of numbers) {
    if (number !== undefined) counts.set(number, (counts.get(number) ?? 0) + 1);
  }
  return numbers.map((number) =>
    number !== undefined && counts.get(number) === 1 ? `chapter-${number}` : undefined,
  );
}

export function resolveEarlyChapter<T extends { heading?: string }>(sections: T[], chapter: number): T {
  const matches = sections.filter((section) => chapterNumber(section.heading) === chapter);
  if (matches.length !== 1) {
    throw new Error(`Chapter ${chapter} must resolve exactly once; found ${matches.length}.`);
  }
  return matches[0];
}
