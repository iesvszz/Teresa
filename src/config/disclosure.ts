/**
 * Disclosure mode (patent protection).
 *
 * `__TERESA_FULL__` is replaced with a literal at build time (vite.config.ts):
 *   npm run build        -> false  (public build: only what the published paper discloses)
 *   npm run build:full   -> true   (private build: proposed design details)
 *
 * Gate full-only code with `__TERESA_FULL__` directly (not via a re-exported
 * variable) so the bundler can drop it from the public build.
 */
export const FULL: boolean = __TERESA_FULL__;
export type Disclosure = "paper" | "full";
export const DISCLOSURE: Disclosure = __TERESA_FULL__ ? "full" : "paper";
