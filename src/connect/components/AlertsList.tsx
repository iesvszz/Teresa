import type { Alert } from "../../teresa/types";
import { UNIT_META } from "../../teresa/model-config";
import { fmtSimTime } from "../../teresa/selectors";

export function AlertsList({ alerts, onAck, empty = "No alerts." }: { alerts: Alert[]; onAck?: (id: number) => void; empty?: string }) {
  if (alerts.length === 0) return <p className="muted small">{empty}</p>;
  return (
    <ul className="alerts">
      {alerts.map((a) => (
        <li key={a.id} className={`alert alert--${a.severity}${a.cleared ? " is-cleared" : ""}${a.acknowledged ? " is-acked" : ""}`}>
          <span className={`tag ${a.severity === "fault" ? "tag-fault" : "tag-warning"}`}>{a.severity}</span>
          <div className="alert__body">
            <strong>{a.message}</strong>
            <span className="small muted num">
              {UNIT_META[a.unitId].label} · {fmtSimTime(a.t)}
              {a.cleared && a.clearedAt !== undefined ? ` · cleared ${fmtSimTime(a.clearedAt)}` : " · active"}
              {a.acknowledged ? " · acknowledged" : ""}
            </span>
          </div>
          {onAck && !a.acknowledged && (
            <button type="button" className="btn btn-sm" onClick={() => onAck(a.id)}>
              Acknowledge
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
