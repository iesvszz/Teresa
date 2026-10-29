import { PAPER_TEXT } from "./paper";
import { FULL_TEXT } from "@private/text";
import type { TextPack } from "./types";

export type { TextPack };

/**
 * Public build: @private/text resolves to src/private-stub/text.ts, which
 * re-exports PAPER_TEXT, so no private wording can reach the bundle.
 */
export const T: TextPack = __TERESA_FULL__ ? FULL_TEXT : PAPER_TEXT;
