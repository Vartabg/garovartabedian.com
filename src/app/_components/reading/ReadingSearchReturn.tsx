"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { findReturnHref } from "@/lib/scriptures/search-url";

function ReturnLink() {
  const params = useSearchParams();
  const href = findReturnHref(new URLSearchParams(params.toString()));
  return href ? <p className="reading-help reading-search-return"><Link href={href} prefetch={false}>← Back to results for “{params.get("find")?.slice(0, 160)}”</Link></p> : null;
}
export default function ReadingSearchReturn() { return <Suspense fallback={null}><ReturnLink /></Suspense>; }
