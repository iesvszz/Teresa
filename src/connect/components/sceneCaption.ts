import type { UnitState } from "../../teresa/types";
import { stageProgress, statusLabel } from "../../teresa/selectors";

/** Text alternative for the 3D view, e.g. "TERESA 3 — Navigating, 62% of this stage". */
export function distanceProgressText(u: UnitState): string {
  const p = Math.round(stageProgress(u) * 100);
  const tail = p > 0 && p < 100 ? `, ${p}% of this stage` : "";
  return `${u.label} (${u.bed}) — ${statusLabel(u)}${tail}.`;
}
