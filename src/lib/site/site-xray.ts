import snapshot from "../../../public/meta/site-xray.json";

export type SiteXray = {
  schemaVersion: number;
  counts: {
    buildScripts: number;
    publicJson: number;
    unitTestFiles: number;
    browserSpecs: number;
    smokeChecks: number;
  };
  /** Page kind (src/lib/site/xray-families.mjs) → browser spec basenames that name it. */
  routeTests: Record<string, string[]>;
  /** World id → JSON files under public/<id> and files under scripts/<id>. */
  worlds: Record<string, { publicJson: number; scripts: number }>;
};

export const SITE_XRAY: SiteXray = snapshot;
