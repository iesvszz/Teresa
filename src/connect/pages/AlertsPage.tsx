import { useState } from "react";
import { useSim } from "../../teresa/hooks";
import { simStore } from "../../teresa/store";
import { useConnect } from "../context";
import { AlertsList } from "../components/AlertsList";

export default function AlertsPage() {
  const { unitId } = useConnect();
  const { ward } = useSim();
  const [filter, setFilter] = useState<"active" | "unit" | "all">("active");
  const alerts = ward.alerts.filter((a) => (filter === "active" ? !a.cleared || !a.acknowledged : filter === "unit" ? a.unitId === unitId : true));
  const unacked = ward.alerts.some((a) => !a.acknowledged);
  return (
    <div className="page">
      <section className="card panel" aria-labelledby="alerts-title">
        <div className="panel__head">
          <h2 id="alerts-title">Alerts</h2>
          <div className="panel__head-actions">
            <div className="segmented" role="group" aria-label="Alert filter">
              <button type="button" aria-pressed={filter === "active"} onClick={() => setFilter("active")}>Needs attention</button>
              <button type="button" aria-pressed={filter === "unit"} onClick={() => setFilter("unit")}>{ward.units[unitId].label}</button>
              <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>All</button>
            </div>
            <button type="button" className="btn btn-sm" disabled={!unacked} onClick={simStore.acknowledgeAll}>
              Acknowledge all
            </button>
          </div>
        </div>
        <p className="small muted">
          Overflow, faults and safety events raised by the simulation. Use <em>Inject fault</em> on the Live Simulation page to see how each is handled.
        </p>
        <AlertsList alerts={alerts} onAck={simStore.acknowledge} empty={filter === "active" ? "Nothing needs attention." : "No alerts."} />
      </section>
    </div>
  );
}
