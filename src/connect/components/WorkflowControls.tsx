import { useState } from "react";
import { simStore, type SimMeta, type SimSpeed } from "../../teresa/store";
import { MOTION_STAGES } from "../../teresa/engine";
import type { InjectableFault, UnitState } from "../../teresa/types";
import { T } from "../../teresa/text";

const FAULTS: Array<{ code: InjectableFault; label: string; when?: (u: UnitState) => boolean }> = [
  { code: "overflow", label: "Buffer overflow sensor" },
  { code: "obstacle", label: "Obstacle on route", when: (u) => MOTION_STAGES.has(u.stage) && !u.obstacle },
  { code: "low-battery", label: "Low battery" },
  { code: "disposal-check", label: T.ui.injectCheckLabel },
  { code: "failed-return", label: "Unit fails to return" },
  { code: "uv-interlock", label: "UV-C lid interlock opens" },
];

const SPEEDS: SimSpeed[] = [1, 5, 20];

/** Playback controls (whole ward) and demo actions (selected unit). */
export function WorkflowControls({ u, meta }: { u: UnitState; meta: SimMeta }) {
  const [fault, setFault] = useState<InjectableFault>("obstacle");
  const [note, setNote] = useState("");
  const selectedFault = FAULTS.find((f) => f.code === fault)!;
  const faultApplies = selectedFault.when ? selectedFault.when(u) : true;
  const canTrip = u.docked && (u.stage === "collecting" || u.stage === "transfer") && u.tankMl > 0 && u.condition !== "fault";
  const hasFaults = u.faults.length > 0 || u.inject.overflow || u.inject.checkFail || u.inject.failedReturn || !u.lidOk;

  const say = (msg: string) => setNote(msg);

  return (
    <section className="card panel controls" aria-labelledby="controls-title">
      <div className="panel__head">
        <h2 id="controls-title">Simulation controls</h2>
        <span className="tag tag-sim">Demo mode</span>
      </div>

      <div className="controls__group" role="group" aria-label="Playback (whole ward)">
        <span className="controls__label">Playback</span>
        <button type="button" className="btn btn-sm btn-primary" onClick={() => simStore.toggle()} aria-pressed={!meta.running}>
          {meta.running ? "Pause" : "Play"}
        </button>
        <button type="button" className="btn btn-sm" onClick={() => { simStore.stepBack(u.id); say(`Rewound the ward to the start of ${u.label}'s stage.`); }}>
          ◀ Step back
        </button>
        <button type="button" className="btn btn-sm" onClick={() => { simStore.stepForward(u.id); say(`Advanced until ${u.label} entered its next stage.`); }}>
          Step forward ▶
        </button>
        <button type="button" className="btn btn-sm" onClick={() => { simStore.restart(); say("Simulation restarted from its initial state."); }}>
          Restart
        </button>
        <div className="segmented" role="group" aria-label="Simulation speed">
          {SPEEDS.map((s) => (
            <button key={s} type="button" aria-pressed={meta.speed === s} onClick={() => simStore.setSpeed(s)}>
              ×{s}
            </button>
          ))}
        </div>
      </div>

      <div className="controls__group" role="group" aria-label={`Actions for ${u.label}`}>
        <span className="controls__label">{u.label}</span>
        <button type="button" className="btn btn-sm" disabled={!canTrip} onClick={() => { if (simStore.forceTrip(u.id)) say(`${u.label}: disposal trip requested.`); }}>
          Start disposal trip
        </button>
        <button type="button" className="btn btn-sm btn-danger" aria-pressed={u.estop} onClick={() => simStore.setEstop(u.id, !u.estop)}>
          {u.estop ? "Release E-stop" : "Emergency stop"}
        </button>
        <button type="button" className="btn btn-sm" disabled={!hasFaults} onClick={() => { simStore.resetFaults(u.id); say(`${u.label}: faults reset.`); }}>
          Reset faults
        </button>
      </div>

      <div className="controls__group" role="group" aria-label="Inject a simulated fault">
        <label className="controls__label" htmlFor="fault-select">Inject fault</label>
        <select id="fault-select" className="select" value={fault} onChange={(e) => setFault(e.target.value as InjectableFault)}>
          {FAULTS.map((f) => (
            <option key={f.code} value={f.code}>
              {f.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn btn-sm"
          disabled={!faultApplies}
          onClick={() => {
            const ok = simStore.inject(u.id, fault);
            say(ok ? `${u.label}: injected "${selectedFault.label}". ${hintFor(fault)}` : "That fault does not apply in the current stage.");
          }}
        >
          Inject
        </button>
        {!faultApplies && <span className="small muted">Applies only while the unit is moving.</span>}
      </div>
      <p className="small muted controls__note" aria-live="polite">
        {note || `Step back/forward and Restart act on the whole ward simulation. Current stage: ${T.stage[u.stage]}.`}
      </p>
    </section>
  );
}

function hintFor(code: InjectableFault): string {
  switch (code) {
    case "disposal-check":
      return "It takes effect at the next disposal.";
    case "failed-return":
      return "It takes effect on the next return trip.";
    case "uv-interlock":
      return "UV-C is blocked until the fault is reset.";
    case "overflow":
      return "Stays active until reset.";
    default:
      return "";
  }
}
