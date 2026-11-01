import { REPORT_CHECKLIST, type JobReport, type ReportPhoto } from "./model";

function examplePhoto(after: boolean): ReportPhoto {
  const canvas = document.createElement("canvas");
  canvas.width = 1000;
  canvas.height = 720;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser could not load the example. You can still enter your own details.");
  context.fillStyle = after ? "#dbe8de" : "#e4dfd2";
  context.fillRect(0, 0, 1000, 720);
  context.fillStyle = "#b6c5ae";
  context.fillRect(0, 0, 1000, 275);
  context.fillStyle = "#80977b";
  for (let x = 0; x < 1000; x += 105) context.fillRect(x, 45, 90, 240);
  context.fillStyle = after ? "#e9e5da" : "#b4a690";
  context.beginPath();
  context.moveTo(370, 265); context.lineTo(630, 265);
  context.lineTo(950, 720); context.lineTo(50, 720); context.closePath();
  context.fill();
  context.strokeStyle = after ? "#b5b5a5" : "#8a816d";
  context.lineWidth = 4;
  for (let y = 320; y < 720; y += 100) {
    context.beginPath(); context.moveTo(100, y); context.lineTo(900, y); context.stroke();
  }
  if (!after) {
    context.fillStyle = "#75654b";
    for (let index = 0; index < 25; index++) {
      const x = 300 + ((index * 97) % 450);
      const y = 330 + ((index * 73) % 350);
      context.beginPath(); context.ellipse(x, y, 15, 6, index, 0, Math.PI * 2); context.fill();
    }
  }
  context.fillStyle = "#173c36";
  context.fillRect(28, 28, 405, 92);
  context.font = "bold 29px Arial, sans-serif";
  context.fillStyle = "#ffffff";
  context.fillText(`EXAMPLE · ${after ? "AFTER" : "BEFORE"}`, 50, 64);
  context.font = "20px Arial, sans-serif";
  context.fillText("Illustration, not customer work", 50, 96);
  const result = { dataUrl: canvas.toDataURL("image/jpeg", 0.85), width: 1000, height: 720 };
  canvas.width = 0; canvas.height = 0;
  return result;
}

export async function exampleReport(): Promise<JobReport> {
  const today = new Date();
  const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return {
    business: "Example Yard Care",
    job: "Front path cleanup — example",
    customer: "Sample customer · 12 Example Lane",
    date: localDate,
    notes: "Example only: cleared loose leaves from the front path, swept the paving and checked the area. The before and after images are illustrations.",
    completed: [...REPORT_CHECKLIST],
    before: examplePhoto(false),
    after: examplePhoto(true),
  };
}
