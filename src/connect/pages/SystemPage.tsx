import { useSim } from "../../teresa/hooks";
import { hardwareSource } from "../../teresa/store";
import { DOCK, ROBOT, SIM } from "../../teresa/model-config";
import { DISCLOSURE } from "../../config/disclosure";
import { T } from "../../teresa/text";

export default function SystemPage() {
  const { ward, meta } = useSim();
  return (
    <div className="page">
      <div className="grid grid--2">
        <section className="card panel" aria-labelledby="sys-src">
          <div className="panel__head"><h2 id="sys-src">Data source</h2></div>
          <dl className="fields">
            <div className="field"><dt>Mode</dt><dd>Demo (simulation)</dd></div>
            <div className="field"><dt>Hardware telemetry</dt><dd>{hardwareSource.connected ? "Connected" : "Not connected"}</dd></div>
            <div className="field"><dt>Simulation</dt><dd>{meta.running ? "Running" : "Paused"} · ×{meta.speed}</dd></div>
            <div className="field"><dt>Units</dt><dd>5 (TERESA 1–5), one ward</dd></div>
            <div className="field field--wide">
              <dt>How it works</dt>
              <dd>
                A deterministic state machine advances in fixed steps. The same inputs always produce the same states. Values change only through workflow
                transitions, never through random noise. The data layer is separate from the interface, so a hardware source can replace it later.
              </dd>
            </div>
          </dl>
        </section>
        <section className="card panel" aria-labelledby="sys-params">
          <div className="panel__head">
            <h2 id="sys-params">Simulation parameters</h2>
            <span className="tag tag-untested">Illustrative</span>
          </div>
          <dl className="fields">
            <div className="field"><dt>Tank capacity (nominal)</dt><dd className="num">{ROBOT.tankCapacityMl} mL</dd></div>
            <div className="field"><dt>Dock buffer (nominal)</dt><dd className="num">{DOCK.bufferCapacityMl} mL</dd></div>
            <div className="field"><dt>Transfer threshold</dt><dd className="num">{ward.settings.transferThresholdMl} mL</dd></div>
            <div className="field"><dt>Trip threshold</dt><dd className="num">{ward.settings.tripThresholdMl} mL</dd></div>
            <div className="field"><dt>Inflow (accelerated)</dt><dd className="num">{SIM.fillRatesMlPerS.join(" / ")} mL/s</dd></div>
            <div className="field"><dt>UV-C stage</dt><dd className="num">{SIM.uvS} s (no validated dose)</dd></div>
            <div className="field field--wide">
              <dt>Note</dt>
              <dd>These are conceptual values for a readable demo. They are not measured or verified specifications.</dd>
            </div>
          </dl>
        </section>
        <section className="card panel" aria-labelledby="sys-rules">
          <div className="panel__head"><h2 id="sys-rules">Simulated safety rules</h2></div>
          <ul className="plain-list">
            <li>Transfer to the tank only while docked and the tank has room.</li>
            <li>{T.ui.systemDisposalRule}</li>
            <li>UV-C runs only while docked with the lid and tank interlocks closed.</li>
            <li>Emergency stop halts motion and closes every valve.</li>
            <li>An obstacle stops the unit until the path clears.</li>
            <li>Low battery postpones the next trip until the battery recovers.</li>
            <li>Only one unit uses the shared aisle and disposal point at a time.</li>
          </ul>
        </section>
        <section className="card panel" aria-labelledby="sys-build">
          <div className="panel__head"><h2 id="sys-build">Build</h2></div>
          <dl className="fields">
            <div className="field"><dt>Disclosure mode</dt><dd>{DISCLOSURE === "full" ? "Full (private build)" : "Public (paper)"}</dd></div>
            <div className="field"><dt>3D</dt><dd>React Three Fiber · procedural geometry</dd></div>
            <div className="field field--wide"><dt>Status</dt><dd>Research prototype concept. Not a medical device. Not for patient use.</dd></div>
          </dl>
        </section>
      </div>
    </div>
  );
}
