import data from "../../../public/jesus/thomas-parables.json";
import { validateThomasParables } from "./thomas-parables-data.mjs";
import type { ThomasParable } from "./types";

/** Separately sourced stories in Thomas, outside the canonical Gospel list. */
export const THOMAS_PARABLES = validateThomasParables(data) as ThomasParable[];
