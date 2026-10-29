import type { LogEntry } from "../../teresa/types";
import { UNIT_META } from "../../teresa/model-config";
import { fmtSimTime } from "../../teresa/selectors";

export function ActivityTimeline({ entries, showUnit = false, empty = "No activity yet." }: { entries: LogEntry[]; showUnit?: boolean; empty?: string }) {
  if (entries.length === 0) return <p className="muted small">{empty}</p>;
  return (
    <ol className="timeline">
      {entries.map((e, i) => (
        <li key={`${e.t}-${e.unitId}-${i}`} className={`timeline__item lvl-${e.level}`}>
          <time className="num">{fmtSimTime(e.t)}</time>
          {showUnit && <span className="timeline__unit">{UNIT_META[e.unitId].label}</span>}
          <span className="timeline__msg">{e.message}</span>
        </li>
      ))}
    </ol>
  );
}
