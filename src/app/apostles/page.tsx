import { getSent, getTwelve } from "@/lib/apostles/server";
import XrayTag from "@/app/_components/xray/XrayTag";
import { apostlesFacts, worldXrayTag } from "@/lib/site/world-xray";
import ApostlesHome from "./ApostlesHome";

/** World home — the band, the four roll-calls, and the doors in. */
export default function ApostlesPage() {
  const twelve = getTwelve();
  const sent = getSent();
  return (
    <>
      <XrayTag {...worldXrayTag("apostles", apostlesFacts(twelve, sent))} />
      <ApostlesHome data={twelve} sent={sent} />
    </>
  );
}
