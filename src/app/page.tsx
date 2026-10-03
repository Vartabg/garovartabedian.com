import type { Metadata } from "next";
import StoryHome from "./_components/StoryHome";

// Collapse any legacy ?v=<version> variants onto one canonical home URL.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/**
 * Home — single presentation (Story). The six alternate skins
 * (Editorial, Terminal, Spatial, Lab, Flux, In Hand) were pruned;
 * this front door now carries the complete world orientation itself.
 */
export default function Home() {
  return (
    <div className="v-root v-story" data-version="story">
      <StoryHome />
    </div>
  );
}
