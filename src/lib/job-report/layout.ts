import type { ReportPhoto } from "./model";
import { loadReportImage } from "./photos";

const WIDTH = 1240;
const HEIGHT = 1754;
const MARGIN = 88;
const BOTTOM = HEIGHT - 112;
const CONTENT = WIDTH - MARGIN * 2;
type TextOptions = { size?: number; bold?: boolean; color?: string; gap?: number };

function wrapText(context: CanvasRenderingContext2D, text: string): string[] {
  const lines: string[] = [];
  for (const paragraph of text.replace(/\r\n?/g, "\n").split("\n")) {
    let line = "";
    for (const word of paragraph.split(/[\t ]+/u).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (context.measureText(candidate).width <= CONTENT) { line = candidate; continue; }
      if (line) { lines.push(line); line = ""; }
      // Keep combining marks and emoji sequences together on modern browsers.
      const characters = typeof Intl.Segmenter === "function"
        ? Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(word), (part) => part.segment)
        : Array.from(word);
      for (const character of characters) {
        if (line && context.measureText(line + character).width > CONTENT) {
          lines.push(line); line = "";
        }
        line += character;
      }
    }
    lines.push(line);
  }
  return lines;
}

export class ReportPages {
  private canvas!: HTMLCanvasElement;
  private context!: CanvasRenderingContext2D;
  private y = 0;
  private pageNumber = 0;

  constructor(private readonly consume: (canvas: HTMLCanvasElement) => Promise<void>) { this.newPage(); }

  private newPage(): void {
    const canvas = document.createElement("canvas");
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser could not create a report. Try a newer browser.");
    this.canvas = canvas;
    this.pageNumber++;
    this.context = context;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, WIDTH, HEIGHT);
    context.textBaseline = "top";
    context.font = "bold 20px Arial, sans-serif";
    context.fillStyle = "#53656b";
    context.fillText("JOB REPORT", MARGIN, 54);
    context.fillStyle = "#17695d";
    context.fillRect(MARGIN, 92, CONTENT, 5);
    this.y = 128;
  }

  private async ensure(height: number): Promise<void> {
    if (this.y + height > BOTTOM) {
      await this.flush();
      this.newPage();
    }
  }

  async text(value: string, { size = 28, bold = false, color = "#21383c", gap = 16 }: TextOptions = {}): Promise<void> {
    const font = `${bold ? "bold " : ""}${size}px Arial, sans-serif`;
    this.context.font = font;
    const lines = wrapText(this.context, value);
    const lineHeight = Math.ceil(size * 1.45);
    for (const line of lines) {
      await this.ensure(lineHeight);
      this.context.font = font;
      this.context.fillStyle = color;
      this.context.fillText(line, MARGIN, this.y);
      this.y += lineHeight;
    }
    this.y += gap;
  }

  async heading(value: string): Promise<void> {
    await this.ensure(100);
    this.y += 12;
    await this.text(value, { size: 25, bold: true, color: "#17695d", gap: 12 });
  }

  async photos(before: ReportPhoto | null, after: ReportPhoto | null): Promise<void> {
    const images = await Promise.all([before, after].map((photo) => photo ? loadReportImage(photo.dataUrl) : null));
    const cellWidth = (CONTENT - 24) / 2;
    const cellHeight = 360;
    await this.ensure(cellHeight + 140);
    await this.heading("Photos");
    for (const [index, label] of ["Before", "After"].entries()) {
      const x = MARGIN + index * (cellWidth + 24);
      this.context.font = "bold 25px Arial, sans-serif";
      this.context.fillStyle = "#21383c";
      this.context.fillText(label, x, this.y);
      const top = this.y + 45;
      this.context.fillStyle = "#f0f4f3";
      this.context.fillRect(x, top, cellWidth, cellHeight);
      const image = images[index];
      if (image) {
        const scale = Math.min(cellWidth / image.naturalWidth, cellHeight / image.naturalHeight);
        const width = image.naturalWidth * scale;
        const height = image.naturalHeight * scale;
        this.context.drawImage(image, x + (cellWidth - width) / 2, top + (cellHeight - height) / 2, width, height);
      } else {
        this.context.font = "24px Arial, sans-serif";
        this.context.fillStyle = "#53656b";
        this.context.fillText(`No ${label.toLowerCase()} photo added.`, x + 20, top + 30);
      }
    }
    this.y += cellHeight + 75;
  }

  private async flush(): Promise<void> {
    const context = this.context;
    context.font = "18px Arial, sans-serif";
    context.fillStyle = "#53656b";
    context.fillText("Prepared from the details entered in the job report demo.", MARGIN, HEIGHT - 67);
    context.textAlign = "right";
    context.fillText(`Page ${this.pageNumber}`, WIDTH - MARGIN, HEIGHT - 67);
    // Consume one page at a time; even a note with many line breaks keeps only
    // one full-size canvas in memory on a phone.
    await this.consume(this.canvas);
    this.dispose();
  }

  async finish(): Promise<void> {
    await this.flush();
  }

  dispose(): void {
    this.canvas.width = 0; this.canvas.height = 0;
  }
}
