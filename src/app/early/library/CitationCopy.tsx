"use client";
import { useState } from "react";
export default function CitationCopy({ citation }: { citation: string }) {
  const [status, setStatus] = useState("");
  return <><button type="button" onClick={async () => { try { await navigator.clipboard.writeText(citation); setStatus("Citation copied."); } catch { setStatus("Select and copy the citation below."); } }}>Copy citation</button><span role="status">{status}</span></>;
}
