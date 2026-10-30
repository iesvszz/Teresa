import { useSim } from "../../teresa/hooks";
import { useConnect } from "../context";
import { ScenePanel } from "../components/ScenePanel";
import { WorkflowControls } from "../components/WorkflowControls";
import { WorkflowStepper } from "../components/WorkflowStepper";
import { UnitTelemetry } from "../components/UnitTelemetry";
import { SafetyStatusPanel } from "../components/SafetyStatusPanel";
import { ActivityTimeline } from "../components/ActivityTimeline";

export default function SimulationPage() {
  const { unitId, select } = useConnect();
  const { ward, meta } = useSim();
  const u = ward.units[unitId];
  return (
    <div className="page">
      <ScenePanel ward={ward} unitId={unitId} onSelect={select} height={600} />
      <WorkflowStepper u={u} settings={ward.settings} />
      <div className="grid grid--sim">
        <div className="stack">
          <WorkflowControls u={u} meta={meta} />
          <section className="card panel" aria-labelledby="sim-log">
            <div className="panel__head"><h2 id="sim-log">{u.label} activity</h2></div>
            <ActivityTimeline entries={ward.log.filter((l) => l.unitId === unitId).slice(0, 8)} />
          </section>
        </div>
        <div className="stack">
          <UnitTelemetry u={u} settings={ward.settings} />
          <SafetyStatusPanel u={u} />
        </div>
      </div>
    </div>
  );
}
