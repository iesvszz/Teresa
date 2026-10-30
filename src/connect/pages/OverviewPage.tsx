import { Link } from "react-router-dom";
import { useSim } from "../../teresa/hooks";
import { activeAlertCount, bufferPct, fmtM, fmtMl, fmtPct, navigationState, statusLabel, tankPct } from "../../teresa/selectors";
import { UNIT_IDS } from "../../teresa/types";
import { T } from "../../teresa/text";
import { simStore } from "../../teresa/store";
import { useConnect } from "../context";
import { ActivityTimeline } from "../components/ActivityTimeline";
import { AlertsList } from "../components/AlertsList";
import { LevelBar } from "../components/LevelBar";

/** "3 collecting, 1 undocking and 1 in UV-C stage" */
function wardSummary(labels: string[]): string {
  const counts = new Map<string, number>();
  for (const l of labels) counts.set(l, (counts.get(l) ?? 0) + 1);
  const parts = [...counts].map(([l, n]) => `${n} ${l.replace(/^[A-Z][a-z]/, (m) => m.toLowerCase())}`);
  return parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}` : parts[0];
}

export default function OverviewPage() {
  const { unitId, search } = useConnect();
  const { ward } = useSim();
  const u = ward.units[unitId];
  const unitLog = ward.log.filter((l) => l.unitId === unitId).slice(0, 6);
  const activeAlerts = ward.alerts.filter((a) => !a.cleared || !a.acknowledged).slice(0, 4);
  const alertCount = activeAlertCount(ward);
  const canTrip = u.docked && (u.stage === "collecting" || u.stage === "transfer") && u.tankMl > 0;

  return (
    <div className="ov">
      <p className="ov-summary">
        Five units on the ward: {wardSummary(UNIT_IDS.map((id) => statusLabel(ward.units[id])))}.{" "}
        <span className={alertCount > 0 ? "ov-summary__alert" : "ov-summary__calm"}>
          {alertCount > 0 ? `${alertCount} alert${alertCount > 1 ? "s" : ""} need attention.` : "No alerts."}
        </span>
      </p>

      <section className="ov-unit" aria-labelledby="ov-unit-title">
        <div className="ov-unit__head">
          <div>
            <h2 id="ov-unit-title">
              {u.label} <span>{u.bed}</span>
            </h2>
            <p className={`ov-unit__state cond-${u.condition}`}>{statusLabel(u)}</p>
            <p className="ov-unit__hint">{T.stageHint[u.stage]}</p>
          </div>
          <div className="ov-unit__actions">
            <Link className="btn btn-primary" to={{ pathname: "/connect/simulation", search }}>
              Open live simulation
            </Link>
            <button type="button" className="btn" onClick={() => simStore.forceTrip(unitId)} disabled={!canTrip}>
              Start disposal trip
            </button>
          </div>
        </div>

        <div className="ov-metrics">
          <div className="ov-metric">
            <span className="ov-metric__label">Mobile tank</span>
            <span className="ov-metric__value num">{fmtPct(tankPct(u))}</span>
            <span className="ov-metric__sub num">{fmtMl(u.tankMl)}</span>
            <LevelBar value={tankPct(u)} label="Mobile tank" />
          </div>
          <div className="ov-metric">
            <span className="ov-metric__label">Dock buffer</span>
            <span className="ov-metric__value num">{fmtPct(bufferPct(u))}</span>
            <span className="ov-metric__sub num">{fmtMl(u.bufferMl)}</span>
            <LevelBar value={bufferPct(u)} label="Dock buffer" />
          </div>
          <div className="ov-metric">
            <span className="ov-metric__label">Battery</span>
            <span className="ov-metric__value num">{fmtPct(u.batteryPct)}</span>
            <span className="ov-metric__sub">{u.docked ? "On dock" : "Away from dock"}</span>
            <LevelBar value={u.batteryPct} tone="battery" label="Battery" />
          </div>
        </div>

        <dl className="ov-facts">
          <div><dt>Location</dt><dd>{u.docked ? `${u.bed} dock` : navigationState(u)}</dd></div>
          <div><dt>To {T.disposalPointName.toLowerCase()}</dt><dd className="num">{fmtM(u.distanceToDrain)}</dd></div>
          <div className="ov-facts__wide"><dt>Last event</dt><dd>{u.lastEvent}</dd></div>
        </dl>
        {ward.queue.length > 0 && (
          <p className="small muted">Waiting for the shared disposal point: {ward.queue.map((q) => ward.units[q].label).join(", ")}.</p>
        )}
      </section>

      <div className="ov-columns">
        <section aria-labelledby="ov-alerts">
          <div className="ov-columns__head">
            <h2 id="ov-alerts">Alerts</h2>
            <Link to={{ pathname: "/connect/alerts", search }}>All alerts</Link>
          </div>
          <AlertsList alerts={activeAlerts} onAck={simStore.acknowledge} empty="Nothing needs attention." />
        </section>
        <section aria-labelledby="ov-activity">
          <div className="ov-columns__head">
            <h2 id="ov-activity">{u.label} activity</h2>
            <Link to={{ pathname: "/connect/activity", search }}>Full log</Link>
          </div>
          <ActivityTimeline entries={unitLog} />
        </section>
      </div>
    </div>
  );
}
