/**
 * TERESA conceptual model configuration.
 *
 * ALL dimensions and simulation parameters live here.
 * Units are metres, millilitres, seconds and percent.
 *
 * IMPORTANT: these are CONCEPTUAL values chosen so the simulation reads
 * clearly. They are NOT verified specifications. The 3D scene is labelled
 * "Conceptual 3D model — not to scale". Replace them with measured values
 * when the physical design exists.
 */

import type { TeresaUnitId } from "./types";

/* ------------------------------------------------------------------ */
/* Ward geometry                                                       */
/* ------------------------------------------------------------------ */

export const WARD = {
  /** Interior extents. Back wall at z = minZ; the front (+Z) is left open for viewing. */
  minX: -7,
  maxX: 7,
  minZ: -4.5,
  maxZ: 4.5,
  wallHeight: 2.8,
  wallThickness: 0.12,
  /** Centre line of the shared aisle used by every unit (z). */
  laneZ: -1.5,
} as const;

export const BED = {
  width: 0.95,
  length: 2.1,
  /** Bed head sits against the back wall; this is the bed centre z. */
  centerZ: WARD.minZ + 0.05 + 2.1 / 2,
  deckHeight: 0.5,
  mattressThickness: 0.16,
  /** Bed centre x for Bed 1..5. */
  xs: [-5.6, -3.2, -0.8, 1.6, 4.0] as const,
} as const;

export const DOCK = {
  /** Bedside table / fixed outer dock. */
  width: 0.5,
  depth: 0.5,
  height: 0.8,
  bayHeight: 0.3,
  panel: 0.02,
  /** Offset of the dock centre from the bed centre (x) — sits beside the bed head. */
  offsetFromBedX: 0.85,
  centerZ: WARD.minZ + 0.03 + 0.5 / 2,
  bufferCapacityMl: 500, // nominal design figure (Category B), not verified
} as const;

export const ROBOT = {
  bodyWidth: 0.34, // x
  bodyLength: 0.46, // z (front = +Z local)
  bodyHeight: 0.2,
  groundClearance: 0.045,
  cornerRadius: 0.05,
  wheelRadius: 0.055,
  wheelWidth: 0.035,
  /** Wheel centres, local coordinates. Exactly four wheels, all driven. */
  wheelX: 0.185,
  wheelZ: 0.15,
  lidarRadius: 0.045,
  lidarHeight: 0.04,
  tankCapacityMl: 3000, // nominal design figure (Category B), not verified
  get topY() {
    return this.groundClearance + this.bodyHeight;
  },
} as const;

/** Exactly four wheels. Checked by a dev-mode assertion in the 3D model and by a unit test. */
export const WHEEL_POSITIONS: ReadonlyArray<{ id: "FL" | "FR" | "RL" | "RR"; x: number; z: number }> = [
  { id: "FL", x: -ROBOT.wheelX, z: ROBOT.wheelZ },
  { id: "FR", x: ROBOT.wheelX, z: ROBOT.wheelZ },
  { id: "RL", x: -ROBOT.wheelX, z: -ROBOT.wheelZ },
  { id: "RR", x: ROBOT.wheelX, z: -ROBOT.wheelZ },
];

export const DRAIN = {
  /** Fixed disposal point in the back-right corner of the ward. It never moves. */
  x: 6.25,
  z: -3.7,
  plateSize: 0.3,
  /** Approach point in front of the disposal point; final approach is slow. */
  approachZ: -3.1,
} as const;

/* ------------------------------------------------------------------ */
/* Simulation parameters (illustrative, time-compressed)               */
/* ------------------------------------------------------------------ */

export const SIM = {
  fixedDt: 1 / 60,
  /** Patient-side inflow is ACCELERATED for the demo (real output is far lower). */
  fillRatesMlPerS: [3.2, 2.4, 2.6, 2.9, 2.2] as const,
  transferRateMlPerS: 30,
  drainRateMlPerS: 75,
  speeds: {
    undock: 0.22,
    navigate: 0.45,
    approach: 0.12,
    return: 0.45,
    dock: 0.18,
    turnRadPerS: 1.1,
  },
  checkS: 2,
  checkRetryS: 3,
  rinseS: 10,
  uvS: 20, // illustrative only — no validated UV-C dose exists
  completeS: 2,
  obstacleHoldS: 6,
  battery: {
    movingPerS: 0.06,
    uvPerS: 0.03,
    idlePerS: 0.004,
    chargePerS: 0.05,
    lowPct: 25,
    resumePct: 35,
  },
  defaultSettings: {
    rinseEnabled: true,
    uvEnabled: true,
    transferThresholdMl: 300,
    tripThresholdMl: 1500,
  },
  maxLog: 400,
  maxAlerts: 120,
  maxHistory: 160,
} as const;

/* ------------------------------------------------------------------ */
/* Per-unit route points                                               */
/* ------------------------------------------------------------------ */

export interface Vec2 {
  x: number;
  z: number;
}

export interface UnitLayout {
  bedX: number;
  dockX: number;
  /** Docked position (inside the bay). */
  dock: Vec2;
  /** Just in front of the bay opening. */
  bayFront: Vec2;
  /** Just outside the bay, in the aisle lane. */
  bayExit: Vec2;
  /** End of the aisle lane, in line with the disposal point. */
  laneEnd: Vec2;
  /** Slow-approach start point. */
  approach: Vec2;
  /** Disposal point (fixed). */
  drain: Vec2;
}

export function unitLayout(index: number): UnitLayout {
  const bedX = BED.xs[index];
  const dockX = bedX + DOCK.offsetFromBedX;
  return {
    bedX,
    dockX,
    dock: { x: dockX, z: DOCK.centerZ },
    bayFront: { x: dockX, z: DOCK.centerZ + 0.6 },
    bayExit: { x: dockX, z: WARD.laneZ },
    laneEnd: { x: DRAIN.x, z: WARD.laneZ },
    approach: { x: DRAIN.x, z: DRAIN.approachZ },
    drain: { x: DRAIN.x, z: DRAIN.z },
  };
}

/** Full route polyline, used by the route overlay and the engine. */
export function routePolyline(index: number): Vec2[] {
  const l = unitLayout(index);
  return [l.dock, l.bayFront, l.bayExit, l.laneEnd, l.approach, l.drain];
}

export const UNIT_META: Record<TeresaUnitId, { index: number; label: string; bed: string }> = {
  "teresa-1": { index: 0, label: "TERESA 1", bed: "Bed 1" },
  "teresa-2": { index: 1, label: "TERESA 2", bed: "Bed 2" },
  "teresa-3": { index: 2, label: "TERESA 3", bed: "Bed 3" },
  "teresa-4": { index: 3, label: "TERESA 4", bed: "Bed 4" },
  "teresa-5": { index: 4, label: "TERESA 5", bed: "Bed 5" },
};
