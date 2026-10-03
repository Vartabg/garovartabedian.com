"use client";

import { useSearchParams } from "next/navigation";
import ResonanceRadar from "@/app/_components/ResonanceRadar";

export default function ResonanceClient() {
  const params = useSearchParams();
  const q = params.get("q") || "";
  return <ResonanceRadar initialQuery={q} standalone={true} />;
}
