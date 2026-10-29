import type { ReactNode } from "react";
import type { SimSettings, UnitState } from "../../teresa/types";
import { bufferPct, fmtM, fmtMl, fmtPct, interlocks, navigationState, stageProgress, statusLabel, systemHealth, tankPct } from "../../teresa/selectors";
import { T } from "../../teresa/text";
import { LevelBar } from "./LevelBar";

function Field({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={`field${wide ? " field--wide" : ""}`}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

const yesNo = (v: boolean, yes = "Yes", no = "No") => (v ? yes : no);

/** Every reading for ONE unit, all from the same simulation snapshot. */
export function UnitTelemetry({ u, settings }: { u: UnitState; settings: SimSettings }) {
  const atDisposal = u.stage === "draining" || u.stage === "rinsing";
  const il = interlocks(u);
  const uvStatus = u.uvOn ? "Running" : u.stage === "uv-treatment" ? (il.uv ? "Starting" : "Blocked — interlock open") : settings.uvEnabled ? "Idle" : "Disabled";
  const disposalProgress = u.stage === "draining" ? fmtPct(stageProgress(u) * 100) : u.stage === "rinsing" || (u.stage === "returning" && u.drainedThisTripMl > 0) ? "100%" : "—";

  return (
    <section className="card panel" aria-labelledby={`tele-${u.id}`}>
      <div className="panel__head">
        <h2 id={`tele-${u.id}`}>{u.label} readings</h2>
        <span className="tag tag-sim">Simulated</span>
      </div>

      <div className="levels">
        <div>
          <div className="levels__row">
            <span>Mobile tank</span>
            <span className="num">
              {fmtPct(tankPct(u))} · {fmtMl(u.tankMl)}
            </span>
          </div>
          <LevelBar value={tankPct(u)} label={`${u.label} mobile tank level`} />
        </div>
        <div>
          <div className="levels__row">
            <span>Dock buffer</span>
            <span className="num">
              {fmtPct(bufferPct(u))} · {fmtMl(u.bufferMl)}
            </span>
          </div>
          <LevelBar value={bufferPct(u)} label={`${u.label} dock buffer level`} />
        </div>
        <div>
          <div className="levels__row">
            <span>Battery {u.charging ? "· charging" : ""}</span>
            <span className="num">{fmtPct(u.batteryPct)}</span>
          </div>
          <LevelBar value={u.batteryPct} tone="battery" label={`${u.label} battery`} />
        </div>
      </div>

      <dl className="fields">
        <Field label="Current state">
          <span className={`cond-${u.condition}`}>{statusLabel(u)}</span>
        </Field>
        <Field label="Dock">{u.docked ? "Docked" : "Undocked"}</Field>
        <Field label="Docking / charging">{u.docked ? (u.charging ? "Docked · charging" : "Docked") : "Away from dock"}</Field>
        <Field label="Navigation">{navigationState(u)}</Field>
        <Field label={`Distance to ${T.disposalPointName.toLowerCase()}`}>
          <span className="num">{fmtM(u.distanceToDrain)}</span>
        </Field>
        <Field label="Obstacle detection">{u.obstacle ? <span className="cond-warning">Obstacle detected</span> : "Clear"}</Field>
        <Field label="Transfer valve">{u.transferValve === "open" ? <span className="cond-fluid">Open</span> : "Closed"}</Field>
        {__TERESA_FULL__ ? (
          <>
            <Field label={T.ui.fieldValve}>{u.disposalValve === "open" ? <span className="cond-fluid">Open</span> : "Closed"}</Field>
            <Field label={T.ui.fieldPosition}>{yesNo(u.positioned, T.ui.positionYes, atDisposal || u.stage === "positioning" ? T.ui.positionPending : "—")}</Field>
            <Field label={T.ui.fieldCheck}>{u.positioned ? yesNo(u.checkOk) : "—"}</Field>
            <Field label={T.ui.fieldRinse}>{settings.rinseEnabled ? (u.stage === "rinsing" ? "Running" : "Enabled") : "Disabled"}</Field>
          </>
        ) : (
          <Field label={T.ui.fieldCheck}>{atDisposal ? "Passed" : u.faults.includes("disposal-check") ? <span className="cond-fault">Failed</span> : u.stage === "positioning" ? "Pending" : "—"}</Field>
        )}
        <Field label="Disposal progress">
          <span className="num">{disposalProgress}</span>
        </Field>
        <Field label="UV-C stage">{uvStatus}</Field>
        <Field label="UV-C safety interlock">{u.lidOk && u.tankSeated ? "Closed (OK)" : <span className="cond-warning">Open</span>}</Field>
        <Field label="System health">
          <span className={`cond-${u.condition}`}>{systemHealth(u)}</span>
        </Field>
        <Field label="Cycles completed">
          <span className="num">{u.cyclesCompleted}</span>
        </Field>
        <Field label="Current task" wide>
          {T.stageHint[u.stage]}
        </Field>
        <Field label="Last event" wide>
          {u.lastEvent || "—"}
        </Field>
      </dl>
    </section>
  );
}
