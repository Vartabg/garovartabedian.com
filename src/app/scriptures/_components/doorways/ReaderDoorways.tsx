"use client";

import doorwaysData from "../../../../../public/scriptures/doorways.json";
import type { DoorwaysData } from "@/lib/scriptures/doorways";
import Doorways, { type DoorwaysStart } from "./Doorways";

const data = doorwaysData as DoorwaysData;

/**
 * The picker with its book data, for the reader's Go to sheet. The chapter
 * page loads this on demand, so a reader who never opens the sheet never
 * downloads it.
 */
export default function ReaderDoorways({ start, onNavigate }: { start: DoorwaysStart; onNavigate: () => void }) {
  return <Doorways data={data} start={start} onNavigate={onNavigate} />;
}
