/**
 * TERESA simulation — shared types.
 *
 * Everything shown in TERESA Connect and in the 3D ward comes from one
 * `WardState` object produced by the simulation engine (`engine.ts`).
 * The engine has no React or Three.js dependency, so a real hardware
 * telemetry source can later produce the same shape.
 */

export const UNIT_IDS = ["teresa-1", "teresa-2", "teresa-3", "teresa-4", "teresa-5"] as const;
export type TeresaUnitId = (typeof UNIT_IDS)[number];

/**
 * Workflow stages. "warning" and "fault" are not stages: they are a separate
 * `condition`, so a unit that faults while navigating still knows where it is
 * in its cycle.
 */
export type Stage =
  | "collecting" // docked; patient side collects into the dock buffer
  | "transfer" // buffer -> mobile tank through the docked coupling
  | "waiting" // trip requested, another unit is using the disposal point
  | "undocking"
  | "navigating"
  | "positioning"
  | "draining"
  | "rinsing" // optional rinse while still at the disposal point
  | "returning"
  | "docking"
  | "uv-treatment"
  | "complete";

export const STAGE_ORDER: Stage[] = [
  "collecting",
  "transfer",
  "waiting",
  "undocking",
  "navigating",
  "positioning",
  "draining",
  "rinsing",
  "returning",
  "docking",
  "uv-treatment",
  "complete",
];

export type Condition = "normal" | "warning" | "fault";

export type FaultCode =
  | "overflow"
  | "obstacle"
  | "low-battery"
  | "disposal-check"
  | "failed-return"
  | "uv-interlock"
  | "estop";

export const FAULT_SEVERITY: Record<FaultCode, "warning" | "fault"> = {
  overflow: "fault",
  obstacle: "warning",
  "low-battery": "warning",
  "disposal-check": "fault",
  "failed-return": "fault",
  "uv-interlock": "warning",
  estop: "fault",
};

/** Faults the user can inject from the demo controls. */
export type InjectableFault = Exclude<FaultCode, "estop">;

export type DataMode = "demo" | "hardware";
export type ValveState = "open" | "closed";

export interface Pose {
  x: number;
  z: number;
  /** Radians about +Y. 0 = facing +Z (out of the dock bay toward the aisle). */
  heading: number;
}

export interface LogEntry {
  t: number;
  unitId: TeresaUnitId;
  level: "info" | "warning" | "fault";
  message: string;
}

export interface Alert {
  id: number;
  t: number;
  unitId: TeresaUnitId;
  code: FaultCode;
  severity: "warning" | "fault";
  message: string;
  acknowledged: boolean;
  /** The condition that raised it has cleared. */
  cleared: boolean;
  clearedAt?: number;
}

export interface UnitState {
  id: TeresaUnitId;
  index: number; // 0..4
  label: string; // "TERESA 1"
  bed: string; // "Bed 1"

  stage: Stage;
  stageStartT: number;
  stageElapsed: number;
  /** Total planned duration of the current stage in sim seconds; Infinity when open-ended. */
  stageDuration: number;
  /** Pose at the start of the current stage (motion plans are rebuilt from it). */
  stageStartPose: Pose;
  /** Re-seat attempt at the disposal point (no motion). */
  checkRetry: boolean;
  /** Volume moved during the current stage (transfer / draining). */
  stageAccumMl: number;

  condition: Condition;
  faults: FaultCode[];

  pose: Pose;
  /** Straight-line distance from the unit to the disposal point, metres (conceptual scale). */
  distanceToDrain: number;

  batteryPct: number;
  charging: boolean;
  tankMl: number;
  bufferMl: number;
  fillRateMlPerS: number;

  docked: boolean;
  transferValve: ValveState;
  disposalValve: ValveState;
  positioned: boolean;
  checkOk: boolean;
  lidOk: boolean;
  tankSeated: boolean;
  obstacle: boolean;
  obstacleClearAt: number | null;
  estop: boolean;
  overflowSensor: boolean;
  uvOn: boolean;

  /** Demo-only injection flags. */
  inject: {
    overflow: boolean;
    checkFail: boolean;
    failedReturn: boolean;
  };

  checkAttempts: number;
  forceTrip: boolean;
  tripRequested: boolean;
  drainedThisTripMl: number;
  cyclesCompleted: number;
  totalDrainedMl: number;
  totalTransferredMl: number;
  lastEvent: string;
}

export interface SimSettings {
  rinseEnabled: boolean;
  uvEnabled: boolean;
  /** Buffer volume that triggers a transfer into the mobile tank. */
  transferThresholdMl: number;
  /** Tank volume that triggers a disposal trip. */
  tripThresholdMl: number;
}

export interface WardState {
  t: number;
  units: Record<TeresaUnitId, UnitState>;
  /** The unit currently away from its dock (owns the aisle and the disposal point). */
  drainHolder: TeresaUnitId | null;
  queue: TeresaUnitId[];
  alerts: Alert[];
  log: LogEntry[];
  nextAlertId: number;
  settings: SimSettings;
}
