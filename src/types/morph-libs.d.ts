// Minimal types for the two libraries HandChange.tsx loads on demand.
// opentype.js 1.3.4 and flubber 0.4.2 ship no TypeScript definitions.
declare module "opentype.js" {
  export type PathCommand =
    | { type: "M" | "L"; x: number; y: number }
    | { type: "Q"; x1: number; y1: number; x: number; y: number }
    | { type: "C"; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
    | { type: "Z" };
  export interface Path {
    commands: PathCommand[];
  }
  export interface Glyph {
    getPath(x: number, y: number, fontSize: number): Path;
  }
  export interface Font {
    unitsPerEm: number;
    ascender: number;
    charToGlyph(char: string): Glyph;
  }
  export function parse(buffer: ArrayBuffer): Font;
}

declare module "flubber" {
  export function interpolate(
    from: string | number[][],
    to: string | number[][],
    options?: { maxSegmentLength?: number; string?: boolean },
  ): (t: number) => string;
}
