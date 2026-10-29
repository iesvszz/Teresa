/// <reference types="vite/client" />

/** Build-time disclosure flag, see src/config/disclosure.ts. */
declare const __TERESA_FULL__: boolean;

interface ImportMetaEnv {
  readonly VITE_TERESA_DISCLOSURE?: "paper" | "full";
  readonly VITE_ROUTER?: "browser" | "hash";
}
