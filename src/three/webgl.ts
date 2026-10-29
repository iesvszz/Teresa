/** Capability checks for the 3D views. */

let cached: boolean | null = null;

export function hasWebGL(): boolean {
  if (cached !== null) return cached;
  try {
    const c = document.createElement("canvas");
    cached = !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    cached = false;
  }
  return cached;
}

/** Rough "lower-powered device" heuristic: fewer cores or a small screen. */
export function isLowPower(): boolean {
  if (typeof window === "undefined") return false;
  const cores = navigator.hardwareConcurrency ?? 8;
  const small = window.matchMedia?.("(max-width: 768px)").matches ?? false;
  return cores <= 4 || small;
}
