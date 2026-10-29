/**
 * Motion planning for the simulated mobile unit.
 *
 * A motion is a list of segments (straight lines, turns in place, waits).
 * The pose at any elapsed time is computed analytically, so motion is smooth,
 * deterministic, and can never "teleport": each stage starts exactly where
 * the previous stage ended.
 *
 * The unit uses skid-steer (four driven wheels), so it can turn in place.
 */

import type { Pose } from "./types";
import type { Vec2 } from "./model-config";

export type Segment =
  | { kind: "line"; from: Vec2; to: Vec2; heading: number; dur: number }
  | { kind: "turn"; at: Vec2; from: number; to: number; dur: number }
  | { kind: "wait"; at: Vec2; heading: number; dur: number };

const TAU = Math.PI * 2;

export function normalizeAngle(a: number): number {
  let r = a % TAU;
  if (r <= -Math.PI) r += TAU;
  if (r > Math.PI) r -= TAU;
  return r;
}

/** Heading that faces from a to b (0 = +Z). */
export function headingTo(a: Vec2, b: Vec2): number {
  return Math.atan2(b.x - a.x, b.z - a.z);
}

export function dist(a: Vec2, b: Vec2): number {
  return Math.hypot(b.x - a.x, b.z - a.z);
}

/** Ease in/out so every segment accelerates and decelerates. */
function ease(u: number): number {
  const c = Math.min(1, Math.max(0, u));
  return c * c * (3 - 2 * c);
}

export interface PlanOptions {
  speed: number;
  turnRate: number;
  /** Drive backwards (the unit faces the opposite way to travel). */
  reverse?: boolean;
  /** Turn to this heading at the end. */
  finalHeading?: number;
  /** Extra stationary time at the end (e.g. a check). */
  waitAtEnd?: number;
}

/** Build segments that drive through `points`, starting at points[0] with `startHeading`. */
export function planPath(points: Vec2[], startHeading: number, opts: PlanOptions): Segment[] {
  const segs: Segment[] = [];
  let heading = startHeading;
  const turnTo = (at: Vec2, target: number) => {
    const delta = normalizeAngle(target - heading);
    if (Math.abs(delta) > 1e-4) {
      segs.push({ kind: "turn", at, from: heading, to: heading + delta, dur: Math.abs(delta) / opts.turnRate });
    }
    heading = normalizeAngle(target);
  };
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const d = dist(a, b);
    if (d < 1e-6) continue;
    const travel = headingTo(a, b);
    const facing = opts.reverse ? normalizeAngle(travel + Math.PI) : travel;
    turnTo(a, facing);
    segs.push({ kind: "line", from: a, to: b, heading: facing, dur: d / opts.speed });
  }
  const end = points[points.length - 1];
  if (opts.finalHeading !== undefined) turnTo(end, opts.finalHeading);
  if (opts.waitAtEnd && opts.waitAtEnd > 0) segs.push({ kind: "wait", at: end, heading, dur: opts.waitAtEnd });
  return segs;
}

export function totalDuration(segs: Segment[]): number {
  return segs.reduce((s, g) => s + g.dur, 0);
}

export function endHeading(segs: Segment[], fallback: number): number {
  for (let i = segs.length - 1; i >= 0; i--) {
    const g = segs[i];
    if (g.kind === "turn") return normalizeAngle(g.to);
    return g.heading;
  }
  return fallback;
}

/** Pose after `elapsed` seconds along the segments. */
export function poseAt(segs: Segment[], elapsed: number, fallback: Pose): Pose {
  if (segs.length === 0) return { ...fallback };
  let t = Math.max(0, elapsed);
  for (const g of segs) {
    if (t <= g.dur || g === segs[segs.length - 1]) {
      const u = g.dur > 0 ? ease(t / g.dur) : 1;
      if (g.kind === "line") {
        return { x: g.from.x + (g.to.x - g.from.x) * u, z: g.from.z + (g.to.z - g.from.z) * u, heading: g.heading };
      }
      if (g.kind === "turn") {
        return { x: g.at.x, z: g.at.z, heading: normalizeAngle(g.from + (g.to - g.from) * u) };
      }
      return { x: g.at.x, z: g.at.z, heading: g.heading };
    }
    t -= g.dur;
  }
  return { ...fallback };
}

/** Fraction of the stage's *distance* covered (for display), 0..1. */
export function distanceProgress(segs: Segment[], elapsed: number): number {
  const total = segs.reduce((s, g) => s + (g.kind === "line" ? dist(g.from, g.to) : 0), 0);
  if (total <= 0) return Math.min(1, elapsed / Math.max(1e-6, totalDuration(segs)));
  let t = Math.max(0, elapsed);
  let covered = 0;
  for (const g of segs) {
    if (t <= g.dur) {
      if (g.kind === "line") covered += dist(g.from, g.to) * ease(t / g.dur);
      break;
    }
    if (g.kind === "line") covered += dist(g.from, g.to);
    t -= g.dur;
  }
  return Math.min(1, covered / total);
}
