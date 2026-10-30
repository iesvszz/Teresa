import { UNIT_IDS, type TeresaUnitId, type WardState } from "../../teresa/types";
import { statusLabel, tankPct } from "../../teresa/selectors";

/** TERESA 1–5 in the sidebar: pick the unit every Connect page shows. */
export function UnitList({
  ward,
  selected,
  onSelect,
  compact,
}: {
  ward: WardState;
  selected: TeresaUnitId;
  onSelect: (id: TeresaUnitId) => void;
  compact: boolean;
}) {
  return (
    <section className={`unit-list${compact ? " unit-list--compact" : ""}`} aria-label="Select TERESA unit">
      {!compact && <p className="unit-list__title">Units</p>}
      <ul>
        {UNIT_IDS.map((id, i) => {
          const u = ward.units[id];
          const active = id === selected;
          return (
            <li key={id}>
              <button
                type="button"
                className={`unit-list__item cond-${u.condition}${active ? " is-active" : ""}${u.docked ? "" : " is-moving"}`}
                aria-pressed={active}
                onClick={() => onSelect(id)}
                title={compact ? `${u.label} · ${statusLabel(u)}` : undefined}
                aria-label={compact ? `${u.label}, ${statusLabel(u)}` : undefined}
              >
                <span className="unit-list__num">{i + 1}</span>
                {!compact && (
                  <>
                    <span className="unit-list__text">
                      <span className="unit-list__name">{u.label}</span>
                      <span className="unit-list__state">{statusLabel(u)}</span>
                    </span>
                    <span className="unit-list__tank" aria-hidden="true">
                      <span style={{ height: `${Math.max(4, tankPct(u))}%` }} />
                    </span>
                  </>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
