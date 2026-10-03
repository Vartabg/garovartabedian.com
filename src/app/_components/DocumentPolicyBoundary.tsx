"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { CHRISTIANITY_ESSAY_PATH } from "@/lib/site/excerpt-video";

/**
 * CSP and COEP belong to the loaded document, not an App Router transition.
 * Crossing the media article boundary needs a new document in both directions:
 * enter with permission to frame YouTube, leave with reader isolation restored.
 */
export default function DocumentPolicyBoundary() {
  const pathname = usePathname();
  const query = useSearchParams().toString();
  const documentAllowsVideo = useRef(pathname === CHRISTIANITY_ESSAY_PATH);
  useEffect(() => {
    if (pathname && documentAllowsVideo.current !== (pathname === CHRISTIANITY_ESSAY_PATH)) {
      // React can commit the destination before Next updates browser history.
      // Navigate to that destination explicitly rather than reloading the old URL.
      const hash = window.location.pathname === pathname ? window.location.hash : "";
      window.location.replace(`${pathname}${query ? `?${query}` : ""}${hash}`);
    }
  }, [pathname, query]);
  return null;
}
