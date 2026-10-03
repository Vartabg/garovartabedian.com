/**
 * Server-side Apostles room data — static imports for first paint without
 * client fetch, matching the other worlds.
 */

import sentJson from "../../../public/apostles/sent.json";
import twelveJson from "../../../public/apostles/twelve.json";
import type { SentData, TwelveData } from "./types";

export const getTwelve = (): TwelveData => twelveJson as TwelveData;
export const getSent = (): SentData => sentJson as SentData;
