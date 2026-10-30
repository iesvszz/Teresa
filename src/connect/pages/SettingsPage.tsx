import { useState } from "react";
import { useSim } from "../../teresa/hooks";
import { simStore, type SimSpeed } from "../../teresa/store";
import { T } from "../../teresa/text";

const CONTACT_KEY = "teresa.caregiverContact";

function readContact(): string {
  try {
    return window.localStorage.getItem(CONTACT_KEY) ?? "";
  } catch {
    return "";
  }
}

export default function SettingsPage() {
  const { ward, meta } = useSim();
  const s = ward.settings;
  const [contact, setContact] = useState(readContact);
  const [saved, setSaved] = useState(false);

  const save = () => {
    try {
      window.localStorage.setItem(CONTACT_KEY, contact);
      setSaved(true);
    } catch {
      setSaved(false);
    }
  };

  return (
    <div className="page">
      <div className="grid grid--2">
        <section className="card panel" aria-labelledby="set-sim">
          <div className="panel__head"><h2 id="set-sim">Simulation</h2><span className="tag tag-sim">Demo</span></div>
          <div className="setting">
            <span className="setting__label">Speed</span>
            <div className="segmented" role="group" aria-label="Simulation speed">
              {([1, 5, 20] as SimSpeed[]).map((v) => (
                <button key={v} type="button" aria-pressed={meta.speed === v} onClick={() => simStore.setSpeed(v)}>×{v}</button>
              ))}
            </div>
          </div>
          {__TERESA_FULL__ && (
            <label className="setting">
              <span className="setting__label">{T.ui.rinseSetting}</span>
              <input type="checkbox" checked={s.rinseEnabled} onChange={(e) => simStore.setSettings({ rinseEnabled: e.target.checked })} />
            </label>
          )}
          <label className="setting">
            <span className="setting__label">UV-C stage after docking</span>
            <input type="checkbox" checked={s.uvEnabled} onChange={(e) => simStore.setSettings({ uvEnabled: e.target.checked })} />
          </label>
          <label className="setting setting--range">
            <span className="setting__label">Transfer threshold <span className="num muted">{s.transferThresholdMl} mL</span></span>
            <input type="range" min={150} max={450} step={25} value={s.transferThresholdMl} onChange={(e) => simStore.setSettings({ transferThresholdMl: Number(e.target.value) })} />
          </label>
          <label className="setting setting--range">
            <span className="setting__label">Trip threshold <span className="num muted">{s.tripThresholdMl} mL</span></span>
            <input type="range" min={900} max={2700} step={100} value={s.tripThresholdMl} onChange={(e) => simStore.setSettings({ tripThresholdMl: Number(e.target.value) })} />
          </label>
          <p className="small muted">Settings apply to all five simulated units. They are not device settings.</p>
        </section>
        <section className="card panel" aria-labelledby="set-alerts">
          <div className="panel__head"><h2 id="set-alerts">Caregiver alerts</h2><span className="tag tag-neutral">Not connected</span></div>
          <label className="setting setting--stack">
            <span className="setting__label">Caregiver contact (stored only in this browser)</span>
            <input className="input" type="text" value={contact} placeholder="e.g. ward nurse station" onChange={(e) => { setContact(e.target.value); setSaved(false); }} />
          </label>
          <button type="button" className="btn btn-sm" onClick={save}>Save</button>
          {saved && <span className="small muted" role="status" style={{ marginLeft: 10 }}>Saved in this browser.</span>}
          <p className="small muted" style={{ marginTop: 12 }}>
            No messages are sent. No real alert channel is connected to this site.
          </p>
        </section>
      </div>
    </div>
  );
}
