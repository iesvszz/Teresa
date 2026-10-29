import type { UnitState } from "../../teresa/types";
import { interlocks } from "../../teresa/selectors";
import { T } from "../../teresa/text";

function Row({ ok, name, detail }: { ok: boolean; name: string; detail: string }) {
  return (
    <li className={`interlock ${ok ? "is-ok" : "is-blocked"}`}>
      <span className="interlock__state">{ok ? "Permitted" : "Blocked"}</span>
      <span className="interlock__name">{name}</span>
      <span className="interlock__detail small muted">{detail}</span>
    </li>
  );
}

/** Simulated interlocks for the selected unit (the engine enforces the same rules). */
export function SafetyStatusPanel({ u }: { u: UnitState }) {
  const il = interlocks(u);
  return (
    <section className="card panel" aria-labelledby="safety-title">
      <div className="panel__head">
        <h2 id="safety-title">Safety interlocks</h2>
        <span className="tag tag-sim">Simulated</span>
      </div>
      <ul className="interlocks">
        <Row ok={il.motion} name="Motion" detail={u.estop ? "Emergency stop engaged" : u.obstacle ? "Obstacle detected" : "No stop condition"} />
        <Row ok={il.transfer} name="Transfer to tank" detail={u.docked ? "Docked" : "Only while docked"} />
        <Row ok={il.disposal} name={T.ui.safetyDisposalName} detail={T.ui.safetyDisposalDetail(u.positioned, u.checkOk)} />
        <Row ok={il.uv} name="UV-C" detail={`Docked: ${u.docked ? "yes" : "no"} · Lid: ${u.lidOk ? "closed" : "open"} · Tank seated: ${u.tankSeated ? "yes" : "no"}`} />
        <Row ok={il.charging} name="Wireless charging" detail={u.docked ? "Dock detected" : "Only while docked"} />
      </ul>
      <p className="small muted">
        UV-C treatment would require a validated dose, an enclosure and safety testing. No sterilisation claim is made.
      </p>
    </section>
  );
}
