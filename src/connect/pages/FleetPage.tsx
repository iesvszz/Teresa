import { useSim } from "../../teresa/hooks";
import { UNIT_IDS } from "../../teresa/types";
import { bufferPct, fmtM, fmtPct, navigationState, statusLabel, systemHealth, tankPct } from "../../teresa/selectors";
import { T } from "../../teresa/text";
import { useConnect } from "../context";

export default function FleetPage() {
  const { unitId, select } = useConnect();
  const { ward } = useSim();
  return (
    <div className="page">
      <section className="card panel" aria-labelledby="fleet-title">
        <div className="panel__head">
          <h2 id="fleet-title">TERESA fleet</h2>
          <span className="tag tag-sim">Simulated</span>
        </div>
        <p className="small muted">
          Five units, one per bed, in one simulated ward. They share one fixed disposal point, so only one unit is away from its dock at a time. Select a row to make it the active unit everywhere.
        </p>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Unit</th>
                <th scope="col">State</th>
                <th scope="col">Dock</th>
                <th scope="col">Battery</th>
                <th scope="col">Tank</th>
                <th scope="col">Buffer</th>
                <th scope="col">Navigation</th>
                <th scope="col">To {T.disposalPointName.toLowerCase()}</th>
                <th scope="col">Health</th>
                <th scope="col">Cycles</th>
              </tr>
            </thead>
            <tbody>
              {UNIT_IDS.map((id) => {
                const u = ward.units[id];
                return (
                  <tr key={id} className={id === unitId ? "is-selected" : undefined}>
                    <th scope="row">
                      <button type="button" className="link-btn" onClick={() => select(id)} aria-pressed={id === unitId}>
                        {u.label}
                      </button>
                      <div className="small muted">{u.bed}</div>
                    </th>
                    <td className={`cond-${u.condition}`}>{statusLabel(u)}</td>
                    <td>{u.docked ? "Docked" : "Undocked"}</td>
                    <td className="num">{fmtPct(u.batteryPct)}</td>
                    <td className="num">{fmtPct(tankPct(u))}</td>
                    <td className="num">{fmtPct(bufferPct(u))}</td>
                    <td>{navigationState(u)}</td>
                    <td className="num">{fmtM(u.distanceToDrain)}</td>
                    <td className={`cond-${u.condition}`}>{systemHealth(u)}</td>
                    <td className="num">{u.cyclesCompleted}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
