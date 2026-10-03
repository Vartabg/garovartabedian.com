/** Synthetic local scheduling benchmark; these are not visitor performance metrics. */
import assert from "node:assert/strict";
import { rankRows, rankRowsAsync } from "../../src/lib/scriptures/semantic-ranking";

async function main() {
  const dims = 384, count = 16_000, k = 40;
  const query = Float32Array.from({length: dims}, (_, i) => Math.sin(i) / Math.sqrt(dims));
  const rows = Int8Array.from({length: dims * count}, (_, i) => (i * 73 % 255) - 127);
  const syncMs: number[] = [], asyncMs: number[] = [], activeSlicesMs: number[] = [];
  let yieldCount = 0;
  // Warm both implementations before collecting ten independent samples.
  rankRows(query, rows, dims, k);
  await rankRowsAsync(query, rows, dims, k);
  for (let sample = 0; sample < 10; sample++) {
    let start = performance.now();
    const expected = rankRows(query, rows, dims, k);
    syncMs.push(performance.now() - start);
    start = performance.now();
    let sliceStart = start;
    const actual = await rankRowsAsync(query, rows, dims, k, {
      yieldControl: async () => {
        activeSlicesMs.push(performance.now() - sliceStart);
        yieldCount++;
        await new Promise<void>(resolve => setImmediate(resolve));
        sliceStart = performance.now();
      },
    });
    activeSlicesMs.push(performance.now() - sliceStart);
    asyncMs.push(performance.now() - start);
    assert.deepEqual(actual, expected);
  }
  const median = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b);
    return Number(((sorted[Math.floor((sorted.length - 1) / 2)] + sorted[Math.floor(sorted.length / 2)]) / 2).toFixed(3));
  };
  console.log(JSON.stringify({
    node: process.version, dims, count, k, samples: syncMs.length, exactRankingParity: true,
    synchronousMedianMs: median(syncMs), cooperativeMedianMs: median(asyncMs),
    largestCooperativeSliceMs: Number(Math.max(...activeSlicesMs).toFixed(3)), yieldCount,
    note: "Synthetic Node run; cooperative scheduling requests an 8 ms budget checked every 128 rows. This is not a strict frame-time bound or a browser latency measurement.",
  }, null, 2));
}
void main();
