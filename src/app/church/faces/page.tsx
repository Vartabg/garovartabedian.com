import { getFaces } from "@/lib/church/server";
import FacesRoom from "./FacesRoom";

export default function FacesPage() {
  return <FacesRoom data={getFaces()} />;
}
