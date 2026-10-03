import { getCasesData } from "@/lib/public-json";
import CasesRoom from "./CasesRoom";

export default function CasesPage() {
  return <CasesRoom data={getCasesData()} />;
}
