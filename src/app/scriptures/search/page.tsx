import { canons } from "@/lib/scriptures/server/canons";
import SearchRoom from "./SearchRoom";

/**
 * The stable search shell is prerendered; its small query-reading boundary and
 * indexed hits hydrate from static data in the browser.
 */
export default function SearchPage() {
  return <SearchRoom canons={canons} publicAssessments={process.env.FIND_PUBLIC_ENABLED === "1"} />;
}
