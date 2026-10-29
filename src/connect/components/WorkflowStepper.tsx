import { STAGE_ORDER, type SimSettings, type Stage, type UnitState } from "../../teresa/types";
import { stageProgress } from "../../teresa/selectors";
import { T } from "../../teresa/text";

/** The selected unit's workflow, with the current stage highlighted. */
export function WorkflowStepper({ u, settings }: { u: UnitState; settings: SimSettings }) {
  const stages: Stage[] = STAGE_ORDER.filter((s) => {
    if (s === "waiting") return u.stage === "waiting";
    if (s === "rinsing") return __TERESA_FULL__ && settings.rinseEnabled;
    if (s === "uv-treatment") return settings.uvEnabled;
    return true;
  });
  const cur = STAGE_ORDER.indexOf(u.stage);
  const pct = Math.round(stageProgress(u) * 100);

  return (
    <section className="card panel" aria-labelledby="wf-title">
      <div className="panel__head">
        <h2 id="wf-title">Workflow — {u.label}</h2>
        <span className="small muted">Stage durations are illustrative</span>
      </div>
      <ol className="stepper">
        {stages.map((s) => {
          const i = STAGE_ORDER.indexOf(s);
          const state = i < cur ? "done" : i === cur ? "current" : "todo";
          return (
            <li key={s} className={`stepper__item is-${state}${state === "current" ? ` cond-${u.condition}` : ""}`} aria-current={state === "current" ? "step" : undefined}>
              <span className="stepper__dot" aria-hidden="true" />
              <span className="stepper__label">{T.stage[s]}</span>
              {state === "current" && pct > 0 && <span className="stepper__pct num">{pct}%</span>}
            </li>
          );
        })}
      </ol>
      <p className="small muted stepper__hint">{T.stageHint[u.stage]}</p>
    </section>
  );
}
