import { Link } from "react-router-dom";
import { useSim } from "../../teresa/hooks";
import { UNIT_IDS } from "../../teresa/types";
import { bufferPct, fmtM, fmtMl, fmtPct, navigationState, statusLabel, tankPct } from "../../teresa/selectors";
import { T } from "../../teresa/text";
import { useConnect } from "../context";
import { ScenePanel } from "../components/ScenePanel";
import { ActivityTimeline } from "../components/ActivityTimeline";
import { AlertsList } from "../components/AlertsList";
import { LevelBar } from "../components/LevelBar";
import { simStore } from "../../teresa/store";

export default function OverviewPage() {
  const { unitId, select, search } = useConnect();
  const { ward } = useSim();
  const u = ward.units[unitId];
  const unitLog = ward.log.filter((l) => l.unitId === unitId).slice(0, 6);
  const activeAlerts = ward.alerts.filter((a) => !a.cleared || !a.acknowledged).slice(0, 4);

  return (
    <div className="page">
      <div className="grid grid--scene">
        <ScenePanel ward={ward} unitId={unitId} onSelect={select} height={460} showModelModes={false} />
        <section className="card panel" aria-labelledby="sel-title">
          <div className="panel__head">
            <h2 id="sel-title">{u.label}</h2>
            <span className={`tag ${u.condition === "fault" ? "tag-fault" : u.condition === "warning" ? "tag-warning" : "tag-neutral"}`}>{statusLabel(u)}</span>
          </div>
          <p className="small muted">{T.stageHint[u.stage]}</p>
          <div className="levels">
            <div>
              <div className="levels__row"><span>Mobile tank</span><span className="num">{fmtPct(tankPct(u))} · {fmtMl(u.tankMl)}</span></div>
              <LevelBar value={tankPct(u)} label="Mobile tank" />
            </div>
            <div>
              <div className="levels__row"><span>Dock buffer</span><span className="num">{fmtPct(bufferPct(u))} · {fmtMl(u.bufferMl)}</span></div>
              <LevelBar value={bufferPct(u)} label="Dock buffer" />
            </div>
            <div>
              <div className="levels__row"><span>Battery</span><span className="num">{fmtPct(u.batteryPct)}</span></div>
              <LevelBar value={u.batteryPct} tone="battery" label="Battery" />
            </div>
          </div>
          <dl className="fields fields--compact">
            <div className="field"><dt>Location</dt><dd>{u.docked ? `${u.bed} dock` : navigationState(u)}</dd></div>
            <div className="field"><dt>To {T.disposalPointName.toLowerCase()}</dt><dd className="num">{fmtM(u.distanceToDrain)}</dd></div>
            <div className="field field--wide"><dt>Last event</dt><dd>{u.lastEvent}</dd></div>
          </dl>
          <div className="panel__actions">
            <Link className="btn btn-primary btn-sm" to={{ pathname: "/connect/simulation", search }}>Open live simulation</Link>
            <button type="button" className="btn btn-sm" onClick={() => simStore.forceTrip(unitId)} disabled={!(u.docked && (u.stage === "collecting" || u.stage === "transfer") && u.tankMl > 0)}>
              Start disposal trip
            </button>
          </div>
        </section>
      </div>

      <section aria-labelledby="fleet-sum">
        <h2 id="fleet-sum" className="section-title">Fleet summary</h2>
        <div className="fleet-cards">
          {UNIT_IDS.map((id) => {
            const x = ward.units[id];
            return (
              <button key={id} type="button" className={`card fleet-card${id === unitId ? " is-active" : ""} cond-${x.condition}`} onClick={() => select(id)} aria-pressed={id === unitId}>
                <span className="fleet-card__name">{x.label}</span>
                <span className="small muted">{x.bed}</span>
                <span className="fleet-card__stage">{statusLabel(x)}</span>
                <span className="small num">Tank {fmtPct(tankPct(x))} · Batt {fmtPct(x.batteryPct)}</span>
              </button>
            );
          })}
        </div>
        <p className="small muted">
          One shared disposal point: only one unit leaves its dock at a time. {ward.queue.length > 0 ? `Waiting: ${ward.queue.map((q) => ward.units[q].label).join(", ")}.` : ""}
        </p>
      </section>

      <div className="grid grid--2">
        <section className="card panel" aria-labelledby="ov-alerts">
          <div className="panel__head">
            <h2 id="ov-alerts">Alerts</h2>
            <Link to={{ pathname: "/connect/alerts", search }} className="small">All alerts</Link>
          </div>
          <AlertsList alerts={activeAlerts} onAck={simStore.acknowledge} empty="No active alerts." />
        </section>
        <section className="card panel" aria-labelledby="ov-activity">
          <div className="panel__head">
            <h2 id="ov-activity">{u.label} activity</h2>
            <Link to={{ pathname: "/connect/activity", search }} className="small">Full log</Link>
          </div>
          <ActivityTimeline entries={unitLog} />
        </section>
      </div>
    </div>
  );
}
