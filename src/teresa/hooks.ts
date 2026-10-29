import { useCallback, useSyncExternalStore } from "react";
import { useSearchParams } from "react-router-dom";
import { simStore, type SimSnapshot } from "./store";
import { UNIT_IDS, type TeresaUnitId } from "./types";

export function useSim(): SimSnapshot {
  return useSyncExternalStore(simStore.subscribe, simStore.getSnapshot, simStore.getSnapshot);
}

export const isUnitId = (v: string | null): v is TeresaUnitId => !!v && (UNIT_IDS as readonly string[]).includes(v);

/** Selected unit lives in the URL (?unit=teresa-3), so every panel and the 3D view agree and refresh keeps it. */
export function useSelectedUnit(): [TeresaUnitId, (id: TeresaUnitId) => void] {
  const [params, setParams] = useSearchParams();
  const raw = params.get("unit");
  const id: TeresaUnitId = isUnitId(raw) ? raw : "teresa-1";
  const select = useCallback(
    (next: TeresaUnitId) =>
      setParams(
        (p) => {
          const n = new URLSearchParams(p);
          n.set("unit", next);
          return n;
        },
        { replace: true },
      ),
    [setParams],
  );
  return [id, select];
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (cb) => {
      if (typeof window === "undefined" || !window.matchMedia) return () => {};
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false),
    () => false,
  );
}
