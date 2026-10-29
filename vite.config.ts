/// <reference types="vitest/config" />
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Disclosure mode (see src/config/disclosure.ts):
//   default         -> "paper": public build, only what the published paper discloses.
//   `--mode full`   -> reads .env.full -> "full": private builds only.
//
// @private/* resolves to src/private (proposed design details, NOT committed)
// only in full mode and only if that folder exists. Otherwise it resolves to
// src/private-stub, so the public bundle cannot contain private content.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const wantsFull = env.VITE_TERESA_DISCLOSURE === "full";
  const privateDir = fileURLToPath(new URL("./src/private", import.meta.url));
  const stubDir = fileURLToPath(new URL("./src/private-stub", import.meta.url));
  const hasPrivate = existsSync(privateDir);
  const full = wantsFull && hasPrivate;
  if (wantsFull && !hasPrivate) {
    console.warn("[TERESA] Full mode requested but src/private is missing — building the public version.");
  }
  return {
    base: env.VITE_BASE || "/",
    plugins: [react()],
    resolve: {
      alias: { "@private": full ? privateDir : stubDir },
    },
    define: {
      __TERESA_FULL__: JSON.stringify(full),
    },
    build: {
      chunkSizeWarningLimit: 1400,
    },
    test: {
      include: ["src/**/*.test.ts"],
      environment: "node",
    },
  };
});
