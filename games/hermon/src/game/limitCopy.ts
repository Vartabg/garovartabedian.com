import type { LimitCue } from './limitCue';
// The words for each limit (limits plan S3). Every message names the fix, not just the limit.
// The turn tip shows once per session for each kind of input, the first time an edge cue ends; after that just the short label.
export type InputKind = 'touch' | 'slide';
export const LIMIT_TEXT = {
  wallTip: { touch: 'EDGE AHEAD · HOLD SCREEN SIDE TO TURN', slide: 'EDGE AHEAD · DRAG OR ARROWS TO TURN' } as Record<InputKind, string>,
  wall: 'EDGE AHEAD',
  ceiling: 'SKY LIMIT · DIVE OR TURN',
  floor: 'WATER BELOW · PULL UP',
  solid: 'SOLID AHEAD · TURN',
} as const;
const seen = new Set<InputKind>();
let last: LimitCue = '', lastKind: InputKind = 'touch';
/** Touch vs desktop input kind for the edge-turn tip. */
export const inputKind = (touch: boolean): InputKind => (touch ? 'touch' : 'slide');
/** The message for this cue ('' for none). Call it on a steady tick: it notices when an edge cue ends and retires that tip. */
export function limitHint(cue: LimitCue, kind: InputKind): string {
  if (last === 'wall' && cue !== 'wall') seen.add(lastKind);
  last = cue; lastKind = kind;
  if (!cue) return '';
  return cue === 'wall' ? seen.has(kind) ? LIMIT_TEXT.wall : LIMIT_TEXT.wallTip[kind] : LIMIT_TEXT[cue];
}
export const resetLimitTips = () => { seen.clear(); last = ''; lastKind = 'touch'; };
