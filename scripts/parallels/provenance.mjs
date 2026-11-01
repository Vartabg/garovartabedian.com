import crypto from "node:crypto";

// An integrity boundary, not a claim that the metadata has expert review.
export const CONTENT_HASH_SCOPE = "witnesses-slots-edges-reception-v1";

export function matrixContentHash(matrix) {
  return crypto.createHash("sha256").update(JSON.stringify({
    witnesses: matrix.witnesses,
    slots: matrix.slots,
    edges: matrix.edges,
    receptionClaims: matrix.receptionClaims,
  })).digest("hex");
}
