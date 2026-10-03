import { throwIfAborted, waitForShared, yieldToBrowser } from "./semantic-task";

export type RankedRow = { row: number; score: number };

/** Stable ties preserve source order, including across asynchronous batches. */
const compare = (a: RankedRow, b: RankedRow) => b.score - a.score || a.row - b.row;

export function validateMatrix(query: Float32Array | number[], rows: Int8Array, dims: number, count?: number) {
  if (!Number.isInteger(dims) || dims <= 0 || query.length !== dims || !query.every(Number.isFinite) ||
      rows.length % dims !== 0 || (count !== undefined && rows.length !== count * dims)) {
    throw new Error("Semantic matrix shape or query is invalid");
  }
}

/** dot(float query, int8 row) / 127 approximates cosine similarity. */
export function scoreRow(query: Float32Array | number[], rows: Int8Array, row: number, dims: number): number {
  let dot = 0;
  const base = row * dims;
  for (let d = 0; d < dims; d++) dot += query[d] * rows[base + d];
  return dot / 127;
}

/** Pure synchronous reference for offline retrieval benchmarks. */
export function rankRows(query: Float32Array | number[], rows: Int8Array, dims: number, k: number): RankedRow[] {
  validateMatrix(query, rows, dims);
  if (!Number.isInteger(k) || k < 0) throw new Error("Invalid result limit");
  const scored = Array.from({ length: rows.length / dims }, (_, row) => ({
    row, score: scoreRow(query, rows, row, dims),
  }));
  return scored.sort(compare).slice(0, k);
}

/** Keep only top-k rows; the heap root is the worst retained result. */
function retain(heap: RankedRow[], item: RankedRow, limit: number): void {
  if (heap.length < limit) {
    heap.push(item);
    let child = heap.length - 1;
    while (child > 0) {
      const parent = (child - 1) >>> 1;
      if (compare(heap[child], heap[parent]) <= 0) break;
      [heap[parent], heap[child]] = [heap[child], heap[parent]];
      child = parent;
    }
  } else if (compare(item, heap[0]) < 0) {
    heap[0] = item;
    let parent = 0;
    while (parent * 2 + 1 < heap.length) {
      let child = parent * 2 + 1;
      if (child + 1 < heap.length && compare(heap[child + 1], heap[child]) > 0) child++;
      if (compare(heap[child], heap[parent]) <= 0) break;
      [heap[parent], heap[child]] = [heap[child], heap[parent]];
      parent = child;
    }
  }
}

export type RankingOptions = {
  signal?: AbortSignal;
  /** Injectable scheduling makes responsiveness tests deterministic. */
  yieldControl?: () => Promise<void>;
  budgetMs?: number;
  /** Reuse across matrices in one search, so small matrices share a budget. */
  budget?: { started: number };
};

/**
 * Browser ranking retains only the best rows and gives input/painting a turn
 * after a time budget. Checking time every 128 rows avoids a clock read for
 * every dot product. Small matrices do not incur unnecessary timer delays.
 */
export async function rankRowsAsync(
  query: Float32Array | number[], rows: Int8Array, dims: number, k: number,
  { signal, yieldControl = yieldToBrowser, budgetMs = 8,
    budget = { started: performance.now() } }: RankingOptions = {},
): Promise<RankedRow[]> {
  throwIfAborted(signal);
  validateMatrix(query, rows, dims);
  if (!Number.isInteger(k) || k < 0) throw new Error("Invalid result limit");
  if (k === 0) return [];
  const heap: RankedRow[] = [];
  const count = rows.length / dims;
  for (let row = 0; row < count; row++) {
    const item = { row, score: scoreRow(query, rows, row, dims) };
    // Parent deduplication needs every chunk; no heap maintenance is needed
    // when the caller already asked to retain every row.
    if (k >= count) heap.push(item);
    else retain(heap, item, k);
    if ((row + 1) % 128 === 0 && performance.now() - budget.started >= budgetMs) {
      await waitForShared(yieldControl(), signal);
      throwIfAborted(signal);
      budget.started = performance.now();
    }
  }
  throwIfAborted(signal);
  return heap.sort(compare);
}
