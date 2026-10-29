/**
 * Simulation store: the single source of truth shared by TERESA Connect and the 3D ward.
 *
 * - One engine instance and ONE animation-frame loop for the whole app
 *   (guarded against React StrictMode double-mounts and Vite HMR).
 * - React subscribes with useSyncExternalStore and receives an immutable
 *   snapshot at most ~6 times per second (plus immediately on events), so
 *   panels never re-render every frame.
 * - The Three.js scene reads `simStore.live` inside useFrame for smooth motion
 *   without React state updates.
 *
 * Data source: DEMO (simulated). `hardwareSource` is a typed stub for later.
 */

import { WardEngine } from "./engine";
import type { DataMode, InjectableFault, SimSettings, TeresaUnitId, WardState } from "./types";

export type SimSpeed = 1 | 5 | 20;

export interface SimMeta {
  running: boolean;
  speed: SimSpeed;
  dataMode: DataMode;
  hardwareConnected: boolean;
  /** Wall-clock time of the last snapshot (ms since epoch). */
  updatedAt: number;
}

export interface SimSnapshot {
  ward: WardState;
  meta: SimMeta;
}

/** Interface a future hardware telemetry source must satisfy. */
export interface TelemetrySource {
  readonly mode: DataMode;
  readonly connected: boolean;
  /** Latest state in the same shape as the simulation. */
  read(): WardState | null;
}

export const hardwareSource: TelemetrySource = {
  mode: "hardware",
  connected: false,
  read: () => null, // not connected: no hardware telemetry exists yet
};

const NOTIFY_INTERVAL_MS = 160;
const MAX_FRAME_DT = 0.1;

const prefersReducedMotion = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

class SimStore {
  readonly engine: WardEngine;
  private meta: SimMeta;
  private snap: SimSnapshot;
  private listeners = new Set<() => void>();
  private raf: number | null = null;
  private lastFrame: number | null = null;
  private lastNotify = 0;
  private lastVersion = -1;

  constructor() {
    this.engine = new WardEngine({ rinseEnabled: __TERESA_FULL__ });
    this.meta = { running: true, speed: 1, dataMode: "demo", hardwareConnected: hardwareSource.connected, updatedAt: Date.now() };
    this.snap = { ward: this.engine.snapshot(), meta: { ...this.meta } };
    this.lastVersion = this.engine.version;
  }

  /** Live (mutable) engine state — for the 3D render loop only. */
  get live(): WardState {
    return this.engine.state;
  }

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    this.ensureLoop();
    return () => {
      this.listeners.delete(fn);
      if (this.listeners.size === 0) this.stopLoop();
    };
  };

  getSnapshot = (): SimSnapshot => this.snap;

  private ensureLoop() {
    if (this.raf !== null || typeof window === "undefined") return;
    this.lastFrame = null;
    const loop = (now: number) => {
      this.raf = window.requestAnimationFrame(loop);
      const dt = this.lastFrame === null ? 0 : Math.min((now - this.lastFrame) / 1000, MAX_FRAME_DT);
      this.lastFrame = now;
      if (this.meta.running) this.engine.advance(dt * this.meta.speed);
      const eventHappened = this.engine.version !== this.lastVersion;
      if (eventHappened || now - this.lastNotify > NOTIFY_INTERVAL_MS) this.publish(now);
    };
    this.raf = window.requestAnimationFrame(loop);
  }

  stopLoop() {
    if (this.raf !== null && typeof window !== "undefined") window.cancelAnimationFrame(this.raf);
    this.raf = null;
    this.lastFrame = null;
  }

  private publish(now = performance.now()) {
    this.lastNotify = now;
    this.lastVersion = this.engine.version;
    this.meta = { ...this.meta, updatedAt: Date.now() };
    this.snap = { ward: this.engine.snapshot(), meta: { ...this.meta } };
    this.listeners.forEach((l) => l());
  }

  /* ---------------- controls ---------------- */

  play = () => {
    this.meta = { ...this.meta, running: true };
    this.publish();
  };
  pause = () => {
    this.meta = { ...this.meta, running: false };
    this.publish();
  };
  toggle = () => (this.meta.running ? this.pause() : this.play());
  setSpeed = (speed: SimSpeed) => {
    this.meta = { ...this.meta, speed };
    this.publish();
  };
  restart = () => {
    this.engine.reset();
    this.publish();
  };
  stepForward = (id: TeresaUnitId) => {
    this.meta = { ...this.meta, running: false };
    this.engine.stepForward(id);
    this.publish();
  };
  stepBack = (id: TeresaUnitId) => {
    this.meta = { ...this.meta, running: false };
    this.engine.stepBack(id);
    this.publish();
  };
  forceTrip = (id: TeresaUnitId) => {
    const ok = this.engine.forceTrip(id);
    this.publish();
    return ok;
  };
  inject = (id: TeresaUnitId, code: InjectableFault) => {
    const ok = this.engine.inject(id, code);
    this.publish();
    return ok;
  };
  setEstop = (id: TeresaUnitId, on: boolean) => {
    this.engine.setEstop(id, on);
    this.publish();
  };
  resetFaults = (id: TeresaUnitId) => {
    this.engine.resetFaults(id);
    this.publish();
  };
  acknowledge = (alertId: number) => {
    this.engine.acknowledge(alertId);
    this.publish();
  };
  acknowledgeAll = () => {
    this.engine.acknowledgeAll();
    this.publish();
  };
  setSettings = (patch: Partial<SimSettings>) => {
    this.engine.setSettings(patch);
    this.publish();
  };

  get reducedMotion() {
    return prefersReducedMotion();
  }
}

/** Module singleton. Survives StrictMode re-mounts; the loop is stopped on HMR dispose. */
export const simStore = new SimStore();

if (import.meta.hot) {
  import.meta.hot.dispose(() => simStore.stopLoop());
}
