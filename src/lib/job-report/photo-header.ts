type ImageHeader = { kind: "jpeg" | "png" | "webp"; width: number; height: number };

// Inspect dimensions before browser decoding so a tiny, highly compressed file
// cannot request an unbounded image allocation. Real photos are resized later.
export function photoHeader(bytes: Uint8Array): ImageHeader | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const text = (start: number, length: number) =>
    String.fromCharCode(...bytes.subarray(start, start + length));
  if (bytes.length >= 24 && bytes[0] === 137 && text(1, 3) === "PNG" &&
      bytes[4] === 13 && bytes[5] === 10 && bytes[6] === 26 && bytes[7] === 10 &&
      text(12, 4) === "IHDR") {
    return { kind: "png", width: view.getUint32(16), height: view.getUint32(20) };
  }
  if (bytes.length >= 26 && text(0, 4) === "RIFF" && text(8, 4) === "WEBP") {
    const tag = text(12, 4);
    if (tag === "VP8X" && bytes.length >= 30) {
      const read24 = (at: number) => bytes[at] + (bytes[at + 1] << 8) + (bytes[at + 2] << 16) + 1;
      return { kind: "webp", width: read24(24), height: read24(27) };
    }
    if (tag === "VP8L" && bytes[20] === 47) {
      return {
        kind: "webp",
        width: 1 + (bytes[21] | ((bytes[22] & 63) << 8)),
        height: 1 + ((bytes[22] >> 6) | (bytes[23] << 2) | ((bytes[24] & 15) << 10)),
      };
    }
    if (tag === "VP8 " && bytes.length >= 30 && bytes[23] === 157 && bytes[24] === 1 && bytes[25] === 42) {
      return { kind: "webp", width: view.getUint16(26, true) & 16383, height: view.getUint16(28, true) & 16383 };
    }
  }
  if (bytes.length < 4 || bytes[0] !== 255 || bytes[1] !== 216) return null;
  let offset = 2;
  while (offset < bytes.length) {
    if (bytes[offset++] !== 255) return null;
    while (bytes[offset] === 255) offset++;
    const marker = bytes[offset++];
    if (marker === 217 || marker === 218 || marker === undefined) return null;
    if (marker === 1 || (marker >= 208 && marker <= 215)) continue;
    if (offset + 2 > bytes.length) return null;
    const length = view.getUint16(offset);
    if (length < 2 || offset + length > bytes.length) return null;
    const isFrame = marker >= 192 && marker <= 207 && ![196, 200, 204].includes(marker);
    if (isFrame && length >= 7) {
      return { kind: "jpeg", width: view.getUint16(offset + 5), height: view.getUint16(offset + 3) };
    }
    offset += length;
  }
  return null;
}
