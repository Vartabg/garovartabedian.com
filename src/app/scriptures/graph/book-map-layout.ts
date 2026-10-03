/** Editorial positions for reading the network; no geographic or chronological meaning. */
export type BookFamily = "law" | "poetry" | "prophets" | "gospels";
export type BookMapPosition = { x: number; y: number; mobileX: number; mobileY: number; family: BookFamily };
export const BOOK_MAP_LAYOUT: Record<string, BookMapPosition> = {
  GEN: { x: 125, y: 100, mobileX: 100, mobileY: 95, family: "law" },
  JOB: { x: 125, y: 390, mobileX: 350, mobileY: 95, family: "poetry" },
  PSA: { x: 330, y: 250, mobileX: 225, mobileY: 265, family: "poetry" },
  ISA: { x: 510, y: 105, mobileX: 100, mobileY: 445, family: "prophets" },
  JER: { x: 490, y: 455, mobileX: 350, mobileY: 445, family: "prophets" },
  EZK: { x: 690, y: 310, mobileX: 225, mobileY: 605, family: "prophets" },
  MAT: { x: 930, y: 105, mobileX: 350, mobileY: 790, family: "gospels" },
  MRK: { x: 1080, y: 285, mobileX: 100, mobileY: 970, family: "gospels" },
  LUK: { x: 855, y: 460, mobileX: 100, mobileY: 790, family: "gospels" },
  JHN: { x: 1080, y: 515, mobileX: 350, mobileY: 970, family: "gospels" },
};

export const FAMILY_NAMES: Record<BookFamily, string> = {
  law: "Law", poetry: "Poetry & wisdom", prophets: "Prophets", gospels: "Gospels",
};

/** Split a quadratic curve so its central vertex can carry a direction arrow.
 * Reversing endpoints reverses the normal, creating a separate return lane. */
export function connectionCurve(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy) || 1;
  const bow = Math.min(58, length * 0.13);
  const control = { x: (a.x + b.x) / 2 - dy / length * bow, y: (a.y + b.y) / 2 + dx / length * bow };
  const first = { x: (a.x + control.x) / 2, y: (a.y + control.y) / 2 };
  const last = { x: (b.x + control.x) / 2, y: (b.y + control.y) / 2 };
  const middle = { x: (first.x + last.x) / 2, y: (first.y + last.y) / 2 };
  const f = (value: number) => Number(value.toFixed(1));
  return `M ${a.x} ${a.y} Q ${f(first.x)} ${f(first.y)} ${f(middle.x)} ${f(middle.y)} Q ${f(last.x)} ${f(last.y)} ${b.x} ${b.y}`;
}
