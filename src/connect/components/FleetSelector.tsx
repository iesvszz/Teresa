import { useRef, type KeyboardEvent } from "react";
import { UNIT_IDS, type TeresaUnitId, type WardState } from "../../teresa/types";
import { fmtPct, statusLabel, tankPct } from "../../teresa/selectors";

/** TERESA 1–5 as a persistent tab list (arrow keys move, Enter/Space or focus selects). */
export function FleetSelector({ ward, selected, onSelect }: { ward: WardState; selected: TeresaUnitId; onSelect: (id: TeresaUnitId) => void }) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % UNIT_IDS.length;
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + UNIT_IDS.length) % UNIT_IDS.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = UNIT_IDS.length - 1;
    if (next >= 0) {
      e.preventDefault();
      onSelect(UNIT_IDS[next]);
      refs.current[next]?.focus();
    }
  };

  return (
    <div className="fleet-tabs" role="tablist" aria-label="Select TERESA unit">
      {UNIT_IDS.map((id, i) => {
        const u = ward.units[id];
        const active = id === selected;
        const dot = u.condition === "fault" ? "dot-fault" : u.condition === "warning" ? "dot-warning" : u.docked ? "dot-ok" : "dot-active";
        return (
          <button
            key={id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={`unit-tab-${id}`}
            role="tab"
            type="button"
            aria-selected={active}
            aria-controls="connect-main"
            tabIndex={active ? 0 : -1}
            className={`fleet-tab${active ? " is-active" : ""} cond-${u.condition}`}
            onClick={() => onSelect(id)}
            onKeyDown={(e) => onKey(e, i)}
          >
            <span className="fleet-tab__name">
              <span className={`dot ${dot}`} aria-hidden="true" />
              {u.label}
            </span>
            <span className="fleet-tab__stage">{statusLabel(u)}</span>
            <span className="fleet-tab__nums num">
              <span title="Battery">Batt {fmtPct(u.batteryPct)}</span>
              <span title="Mobile tank">Tank {fmtPct(tankPct(u))}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
