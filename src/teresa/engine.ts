/**
 * TERESA ward simulation engine (DEMO data source).
 *
 * - Pure TypeScript: no React, no Three.js, no randomness, no wall clock.
 * - Advances in fixed time steps, so the same inputs always give the same state.
 * - Five units, each with its own state machine. One shared aisle and one fixed
 *   disposal point: only one unit is away from its dock at a time (drainHolder),
 *   so units never occupy the same space.
 * - Interlocks are computed every step; the animation can only show what the
 *   state allows (e.g. disposal cannot start before the disposal checks pass).
 *
 * Everything produced here is SIMULATED. It is not sensor data.
 */

import {
  type Alert,
  FAULT_SEVERITY,
  type FaultCode,
  type InjectableFault,
  type LogEntry,
  type Pose,
  type SimSettings,
  type Stage,
  type TeresaUnitId,
  UNIT_IDS,
  type UnitState,
  type WardState,
} from "./types";
import { DOCK, ROBOT, SIM, UNIT_META, unitLayout } from "./model-config";
import { type Segment, dist, endHeading, planPath, poseAt, totalDuration } from "./motion";
import { T } from "./text";

export const MOTION_STAGES: ReadonlySet<Stage> = new Set<Stage>(["undocking", "navigating", "positioning", "returning", "docking"]);

interface InitialUnit {
  stage: Stage;
  elapsed?: number;
  tankMl: number;
  bufferMl: number;
  batteryPct: number;
}

/** Fixed, deterministic starting point so the five units are at different stages. */
const INITIAL: Record<TeresaUnitId, InitialUnit> = {
  "teresa-1": { stage: "collecting", tankMl: 1250, bufferMl: 140, batteryPct: 92 },
  "teresa-2": { stage: "undocking", tankMl: 1700, bufferMl: 40, batteryPct: 81 },
  "teresa-3": { stage: "collecting", tankMl: 600, bufferMl: 250, batteryPct: 67 },
  "teresa-4": { stage: "collecting", tankMl: 1440, bufferMl: 200, batteryPct: 74 },
  "teresa-5": { stage: "uv-treatment", elapsed: 6, tankMl: 0, bufferMl: 90, batteryPct: 58 },
};

interface HistoryEntry {
  t: number;
  unitId: TeresaUnitId;
  stage: Stage;
  state: WardState;
}

const clone = <V>(v: V): V => structuredClone(v);

export class WardEngine {
  state!: WardState;
  /** Increments whenever something worth showing immediately happens (stage change, log, alert). */
  version = 0;
  private history: HistoryEntry[] = [];
  private planCache = new Map<string, Segment[]>();
  private acc = 0;
  private readonly baseSettings: SimSettings;

  constructor(settings: Partial<SimSettings> = {}) {
    this.baseSettings = { ...SIM.defaultSettings, ...settings };
    this.reset();
  }

  /* ------------------------------------------------------------ */
  /* Lifecycle                                                     */
  /* ------------------------------------------------------------ */

  reset(): void {
    const settings = this.state?.settings ?? this.baseSettings;
    const units = {} as Record<TeresaUnitId, UnitState>;
    for (const id of UNIT_IDS) units[id] = this.createUnit(id);
    this.state = {
      t: 0,
      units,
      drainHolder: "teresa-2",
      queue: [],
      alerts: [],
      log: [],
      nextAlertId: 1,
      settings: { ...settings },
    };
    this.history = [];
    this.planCache.clear();
    this.acc = 0;
    for (const id of UNIT_IDS) {
      const u = this.state.units[id];
      const init = INITIAL[id];
      this.enter(u, init.stage, { silent: true });
      if (init.elapsed) {
        u.stageElapsed = Math.min(init.elapsed, u.stageDuration);
        u.stageStartT = -u.stageElapsed;
      }
      if (u.stage === "uv-treatment") u.uvOn = true;
      this.log(u, "info", `${u.label} simulation started — ${T.stage[u.stage]}`);
    }
    this.history = [];
    for (const id of UNIT_IDS) this.recordHistory(this.state.units[id]);
    this.version++;
  }

  private createUnit(id: TeresaUnitId): UnitState {
    const meta = UNIT_META[id];
    const lay = unitLayout(meta.index);
    const init = INITIAL[id];
    const pose: Pose = { x: lay.dock.x, z: lay.dock.z, heading: 0 };
    return {
      id,
      index: meta.index,
      label: meta.label,
      bed: meta.bed,
      stage: init.stage,
      stageStartT: 0,
      stageElapsed: 0,
      stageDuration: Infinity,
      stageStartPose: { ...pose },
      checkRetry: false,
      stageAccumMl: 0,
      condition: "normal",
      faults: [],
      pose,
      distanceToDrain: dist(pose, lay.drain),
      batteryPct: init.batteryPct,
      charging: true,
      tankMl: init.tankMl,
      bufferMl: init.bufferMl,
      fillRateMlPerS: SIM.fillRatesMlPerS[meta.index],
      docked: true,
      transferValve: "closed",
      disposalValve: "closed",
      positioned: false,
      checkOk: false,
      lidOk: true,
      tankSeated: true,
      obstacle: false,
      obstacleClearAt: null,
      estop: false,
      overflowSensor: false,
      uvOn: false,
      inject: { overflow: false, checkFail: false, failedReturn: false },
      checkAttempts: 0,
      forceTrip: false,
      tripRequested: false,
      drainedThisTripMl: 0,
      cyclesCompleted: 0,
      totalDrainedMl: 0,
      totalTransferredMl: 0,
      lastEvent: "",
    };
  }

  /** Advance by `dt` sim seconds using fixed steps. */
  advance(dt: number): void {
    this.acc += Math.max(0, dt);
    let guard = 0;
    while (this.acc >= SIM.fixedDt && guard < 2400) {
      this.step(SIM.fixedDt);
      this.acc -= SIM.fixedDt;
      guard++;
    }
  }

  step(dt: number): void {
    this.state.t += dt;
    for (const id of UNIT_IDS) this.stepUnit(this.state.units[id], dt);
  }

  /* ------------------------------------------------------------ */
  /* Per-unit state machine                                        */
  /* ------------------------------------------------------------ */

  private stepUnit(u: UnitState, dt: number): void {
    const s = this.state;
    const lay = unitLayout(u.index);

    // 1. The fixed dock keeps collecting from the patient line, docked or not.
    u.bufferMl = Math.min(DOCK.bufferCapacityMl, u.bufferMl + u.fillRateMlPerS * dt);
    const overflow = u.inject.overflow || u.bufferMl >= DOCK.bufferCapacityMl - 0.5;
    if (overflow && !u.overflowSensor) {
      u.overflowSensor = true;
      this.raise(u, "overflow");
      this.log(u, "fault", T.log.overflow);
    } else if (!overflow && u.overflowSensor) {
      u.overflowSensor = false;
      this.clear(u, "overflow");
      this.log(u, "info", T.log.overflowClear);
    }

    // 2. Battery.
    const moving = MOTION_STAGES.has(u.stage) && !u.estop && !u.obstacle && !this.isHeld(u);
    u.charging = u.docked && !u.estop;
    let dBattery = 0;
    if (u.charging) dBattery += SIM.battery.chargePerS;
    else dBattery -= SIM.battery.idlePerS;
    if (moving) dBattery -= SIM.battery.movingPerS;
    if (u.uvOn) dBattery -= SIM.battery.uvPerS;
    u.batteryPct = Math.min(100, Math.max(0, u.batteryPct + dBattery * dt));
    if (this.has(u, "low-battery") && u.batteryPct >= SIM.battery.resumePct) {
      this.clear(u, "low-battery");
      this.log(u, "info", T.log.batteryOk);
    }

    u.distanceToDrain = dist(u.pose, lay.drain);

    // 3. Emergency stop and blocking faults hold everything.
    if (u.estop || this.isHeld(u)) {
      u.transferValve = "closed";
      u.disposalValve = "closed";
      u.uvOn = false;
      return;
    }

    // 4. Obstacle: stop until the path clears.
    if (u.obstacle) {
      if (u.obstacleClearAt !== null && s.t >= u.obstacleClearAt) {
        u.obstacle = false;
        u.obstacleClearAt = null;
        this.clear(u, "obstacle");
        this.log(u, "info", T.log.obstacleClear);
      } else {
        return;
      }
    }

    switch (u.stage) {
      case "collecting": {
        u.transferValve = "closed";
        if (u.bufferMl >= s.settings.transferThresholdMl && u.tankMl < ROBOT.tankCapacityMl - 1) {
          this.enter(u, "transfer");
          this.log(u, "info", T.log.transferStart);
        } else if (u.tankMl >= s.settings.tripThresholdMl || u.forceTrip) {
          this.requestTrip(u);
        }
        break;
      }

      case "waiting": {
        if (u.bufferMl >= s.settings.transferThresholdMl && u.tankMl < ROBOT.tankCapacityMl - 1) {
          this.enter(u, "transfer");
          this.log(u, "info", T.log.transferStart);
        } else if (s.drainHolder === null && s.queue[0] === u.id) {
          this.requestTrip(u);
        }
        break;
      }

      case "transfer": {
        const allowed = u.docked && u.tankMl < ROBOT.tankCapacityMl;
        if (!allowed) {
          u.transferValve = "closed";
          this.enter(u, "collecting");
          break;
        }
        u.transferValve = "open";
        const amt = Math.min(SIM.transferRateMlPerS * dt, u.bufferMl, ROBOT.tankCapacityMl - u.tankMl);
        u.bufferMl -= amt;
        u.tankMl += amt;
        u.stageAccumMl += amt;
        u.totalTransferredMl += amt;
        u.stageElapsed += dt;
        if (u.bufferMl <= 0.5 || u.tankMl >= ROBOT.tankCapacityMl - 0.01) {
          u.transferValve = "closed";
          this.log(u, "info", T.log.transferDone(u.stageAccumMl));
          if (s.drainHolder === u.id) {
            // Final top-up done: leave with the dock buffer empty.
            this.requestTrip(u);
          } else {
            this.enter(u, s.queue.includes(u.id) ? "waiting" : "collecting");
          }
        }
        break;
      }

      case "undocking":
      case "navigating":
      case "positioning":
      case "returning":
      case "docking": {
        this.stepMotion(u, dt);
        break;
      }

      case "draining": {
        const disposalAllowed = u.positioned && u.checkOk && !u.estop;
        if (!disposalAllowed) {
          u.disposalValve = "closed";
          break;
        }
        u.disposalValve = "open";
        const amt = Math.min(SIM.drainRateMlPerS * dt, u.tankMl);
        u.tankMl -= amt;
        u.stageAccumMl += amt;
        u.drainedThisTripMl += amt;
        u.totalDrainedMl += amt;
        u.stageElapsed += dt;
        if (u.tankMl <= 0.01) {
          u.tankMl = 0;
          const rinse = s.settings.rinseEnabled;
          this.log(u, "info", T.log.drained(u.stageAccumMl, rinse));
          if (rinse) {
            this.enter(u, "rinsing");
          } else {
            u.disposalValve = "closed";
            this.leaveDrain(u);
            this.enter(u, "returning");
            this.log(u, "info", T.log.returning);
          }
        }
        break;
      }

      case "rinsing": {
        u.disposalValve = u.positioned && u.checkOk ? "open" : "closed";
        u.stageElapsed += dt;
        if (u.stageElapsed >= u.stageDuration) {
          u.disposalValve = "closed";
          this.log(u, "info", T.log.rinseDone);
          this.leaveDrain(u);
          this.enter(u, "returning");
          this.log(u, "info", T.log.returning);
        }
        break;
      }

      case "uv-treatment": {
        const uvAllowed = u.docked && u.lidOk && u.tankSeated && !u.estop;
        if (!uvAllowed) {
          u.uvOn = false;
          if (!this.has(u, "uv-interlock")) {
            this.raise(u, "uv-interlock");
            this.log(u, "warning", T.log.uvBlocked);
          }
          break;
        }
        if (this.has(u, "uv-interlock")) {
          this.clear(u, "uv-interlock");
          this.log(u, "info", T.log.uvResumed);
        }
        u.uvOn = true;
        u.stageElapsed += dt;
        if (u.stageElapsed >= u.stageDuration) {
          u.uvOn = false;
          this.log(u, "info", T.log.uvDone);
          this.enter(u, "complete");
        }
        break;
      }

      case "complete": {
        u.stageElapsed += dt;
        if (u.stageElapsed >= u.stageDuration) {
          u.cyclesCompleted++;
          u.forceTrip = false;
          u.tripRequested = false;
          u.drainedThisTripMl = 0;
          this.log(u, "info", T.log.complete);
          this.enter(u, "collecting");
        }
        break;
      }
    }
  }

  private stepMotion(u: UnitState, dt: number): void {
    const segs = this.segments(u);
    u.stageElapsed = Math.min(u.stageElapsed + dt, u.stageDuration);
    u.pose = poseAt(segs, u.stageElapsed, u.pose);
    const lay = unitLayout(u.index);
    u.distanceToDrain = dist(u.pose, lay.drain);

    if (u.stage === "returning" && u.inject.failedReturn && u.stageElapsed >= u.stageDuration * 0.35) {
      u.inject.failedReturn = false;
      this.raise(u, "failed-return");
      this.log(u, "fault", T.log.failedReturn);
      return;
    }

    if (u.stageElapsed < u.stageDuration) return;

    switch (u.stage) {
      case "undocking":
        this.enter(u, "navigating");
        this.log(u, "info", T.log.navigate);
        break;
      case "navigating":
        this.enter(u, "positioning");
        this.log(u, "info", T.log.approach);
        break;
      case "positioning": {
        u.positioned = true;
        u.checkOk = !u.inject.checkFail;
        if (u.checkOk) {
          u.checkAttempts = 0;
          this.log(u, "info", T.log.disposalOk);
          this.enter(u, "draining");
        } else {
          u.checkAttempts++;
          if (u.checkAttempts < 2) {
            this.log(u, "warning", T.log.disposalRetry);
            this.enter(u, "positioning", { retry: true });
          } else {
            u.disposalValve = "closed";
            this.raise(u, "disposal-check");
            this.log(u, "fault", T.log.disposalFail);
          }
        }
        break;
      }
      case "returning":
        this.enter(u, "docking");
        break;
      case "docking": {
        u.docked = true;
        u.charging = true;
        if (this.state.drainHolder === u.id) this.state.drainHolder = null;
        this.log(u, "info", T.log.docked);
        if (this.state.settings.uvEnabled) {
          this.enter(u, "uv-treatment");
          this.log(u, "info", T.log.uvStart);
        } else {
          this.log(u, "info", T.log.uvSkipped);
          this.enter(u, "complete");
        }
        break;
      }
      default:
        break;
    }
  }

  private requestTrip(u: UnitState): void {
    const s = this.state;
    if (this.has(u, "low-battery")) return;
    if (u.batteryPct < SIM.battery.lowPct) {
      this.raise(u, "low-battery");
      this.log(u, "warning", T.log.lowBattery(u.batteryPct));
      return;
    }
    if (!u.tripRequested) {
      u.tripRequested = true;
      this.log(u, "info", T.log.tripRequested((u.tankMl / ROBOT.tankCapacityMl) * 100));
    }
    const first = s.queue.length === 0 || s.queue[0] === u.id;
    if ((s.drainHolder === null && first) || s.drainHolder === u.id) {
      s.queue = s.queue.filter((q) => q !== u.id);
      s.drainHolder = u.id;
      // Empty the dock buffer into the tank before leaving, so the dock has
      // its full capacity while the unit is away.
      if (u.bufferMl > 15 && u.tankMl < ROBOT.tankCapacityMl - 1 && u.stage !== "transfer") {
        this.enter(u, "transfer");
        this.log(u, "info", T.log.finalTransfer);
        return;
      }
      u.docked = false;
      u.charging = false;
      u.drainedThisTripMl = 0;
      this.enter(u, "undocking");
      this.log(u, "info", T.log.undock);
      return;
    }
    if (!s.queue.includes(u.id)) {
      s.queue.push(u.id);
      const holder = s.drainHolder ? s.units[s.drainHolder].label : s.units[s.queue[0]].label;
      this.log(u, "info", T.log.waiting(holder));
    }
    if (u.stage !== "waiting") this.enter(u, "waiting");
  }

  private leaveDrain(u: UnitState): void {
    u.positioned = false;
    u.checkOk = false;
    u.disposalValve = "closed";
  }

  /* ------------------------------------------------------------ */
  /* Stage entry and motion plans                                  */
  /* ------------------------------------------------------------ */

  private enter(u: UnitState, stage: Stage, opts: { retry?: boolean; silent?: boolean } = {}): void {
    u.stage = stage;
    u.stageStartT = this.state.t;
    u.stageElapsed = 0;
    u.stageStartPose = { ...u.pose };
    u.checkRetry = !!opts.retry;
    u.stageAccumMl = 0;
    if (stage === "undocking") u.docked = false;
    const segs = this.segments(u);
    u.stageDuration = this.durationFor(u, segs);
    this.version++;
    if (!opts.silent) this.recordHistory(u);
  }

  private durationFor(u: UnitState, segs: Segment[]): number {
    if (MOTION_STAGES.has(u.stage)) return totalDuration(segs);
    switch (u.stage) {
      case "rinsing":
        return SIM.rinseS;
      case "uv-treatment":
        return SIM.uvS;
      case "complete":
        return SIM.completeS;
      default:
        return Infinity; // volume- or event-driven
    }
  }

  /** Motion plan for the unit's current stage, rebuilt deterministically from stageStartPose. */
  segments(u: UnitState): Segment[] {
    if (!MOTION_STAGES.has(u.stage)) return [];
    const key = `${u.id}|${u.stage}|${u.stageStartT}|${u.checkRetry}`;
    const cached = this.planCache.get(key);
    if (cached) return cached;
    const lay = unitLayout(u.index);
    const p0 = u.stageStartPose;
    const start = { x: p0.x, z: p0.z };
    const turnRate = SIM.speeds.turnRadPerS;
    let segs: Segment[] = [];
    switch (u.stage) {
      case "undocking":
        segs = planPath([start, lay.bayFront], p0.heading, { speed: SIM.speeds.undock, turnRate });
        break;
      case "navigating":
        segs = planPath([start, lay.bayExit, lay.laneEnd, lay.approach], p0.heading, { speed: SIM.speeds.navigate, turnRate });
        break;
      case "positioning":
        segs = u.checkRetry
          ? [{ kind: "wait", at: start, heading: p0.heading, dur: SIM.checkRetryS }]
          : planPath([start, lay.drain], p0.heading, { speed: SIM.speeds.approach, turnRate, waitAtEnd: SIM.checkS });
        break;
      case "returning":
        segs = planPath([start, lay.approach, lay.laneEnd, lay.bayExit, lay.bayFront], p0.heading, {
          speed: SIM.speeds.return,
          turnRate,
          finalHeading: 0,
        });
        break;
      case "docking":
        segs = planPath([start, lay.dock], p0.heading, { speed: SIM.speeds.dock, turnRate, reverse: true });
        break;
    }
    if (this.planCache.size > 64) this.planCache.clear();
    this.planCache.set(key, segs);
    return segs;
  }

  /** Heading the unit will have at the end of its current motion stage. */
  plannedEndHeading(u: UnitState): number {
    return endHeading(this.segments(u), u.pose.heading);
  }

  /* ------------------------------------------------------------ */
  /* Faults, alerts, log                                           */
  /* ------------------------------------------------------------ */

  private has(u: UnitState, code: FaultCode): boolean {
    return u.faults.includes(code);
  }

  /** Faults that stop the unit's workflow until an operator resets them. */
  private isHeld(u: UnitState): boolean {
    return this.has(u, "disposal-check") || this.has(u, "failed-return");
  }

  private raise(u: UnitState, code: FaultCode): void {
    if (this.has(u, code)) return;
    u.faults = [...u.faults, code];
    const s = this.state;
    const alert: Alert = {
      id: s.nextAlertId++,
      t: s.t,
      unitId: u.id,
      code,
      severity: FAULT_SEVERITY[code],
      message: T.fault[code],
      acknowledged: false,
      cleared: false,
    };
    s.alerts = [alert, ...s.alerts].slice(0, SIM.maxAlerts);
    this.updateCondition(u);
    this.version++;
  }

  private clear(u: UnitState, code: FaultCode): void {
    if (!this.has(u, code)) return;
    u.faults = u.faults.filter((f) => f !== code);
    const s = this.state;
    s.alerts = s.alerts.map((a) =>
      a.unitId === u.id && a.code === code && !a.cleared ? { ...a, cleared: true, clearedAt: s.t } : a,
    );
    this.updateCondition(u);
    this.version++;
  }

  private updateCondition(u: UnitState): void {
    if (u.faults.some((f) => FAULT_SEVERITY[f] === "fault")) u.condition = "fault";
    else if (u.faults.length) u.condition = "warning";
    else u.condition = "normal";
  }

  private log(u: UnitState, level: LogEntry["level"], message: string): void {
    const s = this.state;
    s.log = [{ t: s.t, unitId: u.id, level, message }, ...s.log].slice(0, SIM.maxLog);
    u.lastEvent = message;
    this.version++;
  }

  private recordHistory(u: UnitState): void {
    this.history.push({ t: this.state.t, unitId: u.id, stage: u.stage, state: clone(this.state) });
    if (this.history.length > SIM.maxHistory) this.history.splice(0, this.history.length - SIM.maxHistory);
  }

  /* ------------------------------------------------------------ */
  /* Operator / demo actions                                       */
  /* ------------------------------------------------------------ */

  /** Inject a simulated fault (demo mode only). Returns false when it does not apply now. */
  inject(unitId: TeresaUnitId, code: InjectableFault): boolean {
    const u = this.state.units[unitId];
    switch (code) {
      case "overflow":
        u.inject.overflow = true;
        return true;
      case "obstacle":
        if (!MOTION_STAGES.has(u.stage) || u.obstacle) return false;
        u.obstacle = true;
        u.obstacleClearAt = this.state.t + SIM.obstacleHoldS;
        this.raise(u, "obstacle");
        this.log(u, "warning", T.log.obstacle);
        return true;
      case "low-battery":
        u.batteryPct = Math.min(u.batteryPct, 15);
        this.raise(u, "low-battery");
        this.log(u, "warning", T.log.lowBattery(u.batteryPct));
        return true;
      case "disposal-check":
        u.inject.checkFail = true;
        return true;
      case "failed-return":
        u.inject.failedReturn = true;
        return true;
      case "uv-interlock":
        u.lidOk = false;
        return true;
    }
  }

  setEstop(unitId: TeresaUnitId, on: boolean): void {
    const u = this.state.units[unitId];
    if (u.estop === on) return;
    u.estop = on;
    if (on) {
      u.transferValve = "closed";
      u.disposalValve = "closed";
      u.uvOn = false;
      this.raise(u, "estop");
      this.log(u, "fault", T.log.estopOn);
    } else {
      this.clear(u, "estop");
      this.log(u, "info", T.log.estopOff);
    }
  }

  /** Operator reset: clears injected conditions and blocking faults. */
  resetFaults(unitId: TeresaUnitId): void {
    const u = this.state.units[unitId];
    const had = u.faults.length > 0 || u.inject.overflow || u.inject.checkFail || u.inject.failedReturn || !u.lidOk;
    u.inject = { overflow: false, checkFail: false, failedReturn: false };
    u.lidOk = true;
    if (u.estop) this.setEstop(unitId, false);
    if (u.obstacle) {
      u.obstacle = false;
      u.obstacleClearAt = null;
      this.clear(u, "obstacle");
    }
    if (u.stage !== "uv-treatment") this.clear(u, "uv-interlock");
    if (this.has(u, "failed-return")) this.clear(u, "failed-return");
    if (this.has(u, "disposal-check")) {
      this.clear(u, "disposal-check");
      u.checkAttempts = 0;
      this.leaveDrain(u);
      this.enter(u, "returning");
      this.log(u, "info", T.log.returningNoDisposal);
    }
    if (had) this.log(u, "info", T.log.reset);
  }

  /** Request a disposal trip now (docked units only). */
  forceTrip(unitId: TeresaUnitId): boolean {
    const u = this.state.units[unitId];
    if (!u.docked || !(u.stage === "collecting" || u.stage === "transfer")) return false;
    if (u.tankMl <= 0) return false;
    u.forceTrip = true;
    this.log(u, "info", T.log.forced);
    return true;
  }

  acknowledge(alertId: number): void {
    this.state.alerts = this.state.alerts.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a));
    this.version++;
  }

  acknowledgeAll(): void {
    this.state.alerts = this.state.alerts.map((a) => ({ ...a, acknowledged: true }));
    this.version++;
  }

  setSettings(patch: Partial<SimSettings>): void {
    this.state.settings = { ...this.state.settings, ...patch };
    this.version++;
  }

  /** Rewind the whole ward to the start of the unit's current stage (or the previous one if it just started). */
  stepBack(unitId: TeresaUnitId): boolean {
    const u = this.state.units[unitId];
    const entries = this.history.map((h, i) => ({ h, i })).filter((e) => e.h.unitId === unitId);
    if (entries.length === 0) return false;
    // The last entry is the start of the current stage. If the stage has only
    // just started, go one stage further back.
    let k = entries.length - 1;
    if (u.stageElapsed < 1 && k > 0) k--;
    const target = entries[k];
    this.state = clone(target.h.state);
    this.history = this.history.slice(0, target.i + 1);
    this.planCache.clear();
    this.acc = 0;
    this.version++;
    return true;
  }

  /** Run the simulation until the unit enters its next stage (bounded). */
  stepForward(unitId: TeresaUnitId, maxSimSeconds = 900): boolean {
    const startT = this.state.units[unitId].stageStartT;
    const startStage = this.state.units[unitId].stage;
    const limit = this.state.t + maxSimSeconds;
    while (this.state.t < limit) {
      this.step(SIM.fixedDt);
      const u = this.state.units[unitId];
      if (u.stageStartT !== startT || u.stage !== startStage) return true;
    }
    return false;
  }

  /** A deep copy for React consumers. */
  snapshot(): WardState {
    return clone(this.state);
  }
}
