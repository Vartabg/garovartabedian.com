import { REPORT_LIMITS, type ReportPhoto } from "./model";
import { photoHeader } from "./photo-header";

export function loadReportImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("That photo could not be opened. Choose a different JPEG, PNG or WebP image."));
    image.src = source;
  });
}

export async function readReportPhoto(file: File): Promise<ReportPhoto> {
  if (!file.size) throw new Error("That file is empty. Choose a JPEG, PNG or WebP photo.");
  if (file.size > REPORT_LIMITS.photoBytes) throw new Error("Choose a photo up to 10 MB.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const header = photoHeader(bytes);
  if (!header) throw new Error("Choose a JPEG, PNG or WebP photo. HEIC files need to be converted first.");
  if (!header.width || !header.height || header.width > 32768 || header.height > 32768 ||
      header.width * header.height > 64 * 1024 * 1024) {
    throw new Error("That photo is too large to process here. Choose a smaller copy.");
  }
  const blob = new Blob([bytes], { type: `image/${header.kind}` });
  const url = URL.createObjectURL(blob);
  let canvas: HTMLCanvasElement | undefined;
  try {
    // Browsers apply JPEG orientation during image decoding; the new canvas
    // contains pixels only, removing EXIF (including location) from the report.
    const image = await loadReportImage(url);
    if (!image.naturalWidth || !image.naturalHeight ||
        image.naturalWidth * image.naturalHeight > 64 * 1024 * 1024) {
      throw new Error("That photo is too large to process here. Choose a smaller copy.");
    }
    const scale = Math.min(1, REPORT_LIMITS.photoEdge / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser could not prepare the photo. Try a newer browser.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    return { dataUrl: canvas.toDataURL("image/jpeg", 0.84), width, height };
  } catch (error) {
    if (error instanceof Error && /browser|photo could not|too large/.test(error.message)) throw error;
    throw new Error("That photo could not be processed. Choose a different JPEG, PNG or WebP image.");
  } finally {
    URL.revokeObjectURL(url);
    if (canvas) { canvas.width = 0; canvas.height = 0; }
  }
}
