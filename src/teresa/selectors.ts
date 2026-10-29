/** Derived, display-oriented values. Pure functions of UnitState / WardState. */

import { DOCK, ROBOT } from "./model-config";
import type { Stage, UnitState, WardState } from "./types";
import { T } from "./text";

export const tankPct = (u: UnitState) => (u.tankMl / ROBOT.tankCapacityMl) * 100;
export const bufferPct = (u: UnitState) => (u.bufferMl / DOCK.bufferCapacityMl) * 100;

export const isAway = (u: UnitState) => !u.docked;

/** 0..1 progress through the current stage. */
export function stageProgress(u: UnitState): number {
  switch (u.stage) {
    case "transfer": {
      const total = u.stageAccumMl + u.bufferMl;
      return total > 0 ? u.stageAccumMl / total : 1;
    }
    case "draining": {
      const total = u.stageAccumMl + u.tankMl;
      return total > 0 ? u.stageAccumMl / total : 1;
    }
    case "collecting":
    case "waiting":
      return 0;
    default:
      return Number.isFinite(u.stageDuration) && u.stageDuration > 0 ? Math.min(1, u.stageElapsed / u.stageDuration) : 0;
  }
}

export interface Interlocks {
  transfer: boolean;
  disposal: boolean;
  uv: boolean;
  motion: boolean;
  charging: boolean;
}

/** The same rules the engine enforces, for display. */
export function interlocks(u: UnitState): Interlocks {
  return {
    transfer: u.docked && !u.estop && u.tankMl < ROBOT.tankCapacityMl,
    disposal: u.positioned && u.checkOk && !u.estop,
    uv: u.docked && u.lidOk && u.tankSeated && !u.estop,
    motion: !u.estop && !u.obstacle,
    charging: u.docked && !u.estop,
  };
}

export function stageLabel(stage: Stage): string {
  return T.stage[stage];
}

/** Short status line, e.g. "Fault · Navigating". */
export function statusLabel(u: UnitState): string {
  if (u.estop) return "Emergency stop";
  if (u.condition === "fault") return `Fault · ${T.stage[u.stage]}`;
  if (u.condition === "warning") return `Warning · ${T.stage[u.stage]}`;
  return T.stage[u.stage];
}

export function navigationState(u: UnitState): string {
  if (u.docked) return "Docked";
  if (u.obstacle) return "Stopped — obstacle";
  if (u.condition === "fault") return "Stopped — fault";
  switch (u.stage) {
    case "undocking":
      return "Leaving dock";
    case "navigating":
      return `To ${T.disposalPointName.toLowerCase()}`;
    case "positioning":
      return "Final approach";
    case "draining":
    case "rinsing":
      return `At ${T.disposalPointName.toLowerCase()}`;
    case "returning":
      return "Returning";
    case "docking":
      return "Entering dock";
    default:
      return "—";
  }
}

export function systemHealth(u: UnitState): "OK" | "Warning" | "Fault" {
  return u.condition === "fault" ? "Fault" : u.condition === "warning" ? "Warning" : "OK";
}

export function activeAlertCount(w: WardState): number {
  return w.alerts.filter((a) => !a.acknowledged && !a.cleared).length;
}

export function fmtSimTime(t: number): string {
  const s = Math.max(0, Math.floor(t));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export const fmtPct = (v: number) => `${Math.round(v)}%`;
export const fmtMl = (v: number) => `${Math.round(v).toLocaleString("en-IN")} mL`;
export const fmtM = (v: number) => `${v.toFixed(1)} m`;
