import { Link, NavLink, Outlet } from "react-router-dom";
import { useSelectedUnit, useSim } from "../teresa/hooks";
import { activeAlertCount, fmtSimTime, statusLabel } from "../teresa/selectors";
import { TeresaWordmark } from "../components/TeresaWordmark";
import { Disclaimer } from "../components/Disclaimer";
import { FleetSelector } from "./components/FleetSelector";
import { SimBadge } from "./components/SimBadge";
import type { ConnectContext } from "./context";

const NAV = [
  { to: "/connect", label: "Overview", end: true },
  { to: "/connect/fleet", label: "TERESA Fleet" },
  { to: "/connect/simulation", label: "Live Simulation" },
  { to: "/connect/activity", label: "Activity" },
  { to: "/connect/alerts", label: "Alerts", alerts: true },
  { to: "/connect/system", label: "System Information" },
  { to: "/connect/settings", label: "Settings" },
];

export default function ConnectLayout() {
  const [unitId, select] = useSelectedUnit();
  const { ward, meta } = useSim();
  const u = ward.units[unitId];
  const search = `?unit=${unitId}`;
  const alerts = activeAlertCount(ward);
  const ctx: ConnectContext = { unitId, select, search };

  return (
    <div className="connect">
      <a href="#connect-main" className="skip-link">Skip to dashboard</a>
      <aside className="connect-sidebar" aria-label="TERESA Connect">
        <Link to="/" className="connect-sidebar__brand" aria-label="TERESA home">
          <TeresaWordmark height={13} />
          <span>Connect</span>
        </Link>
        <nav aria-label="Dashboard">
          <ul>
            {NAV.map((n) => (
              <li key={n.to}>
                <NavLink to={{ pathname: n.to, search }} end={n.end} className={({ isActive }) => (isActive ? "is-active" : undefined)}>
                  {n.label}
                  {n.alerts && alerts > 0 && (
                    <span className="nav-count" aria-label={`${alerts} active alerts`}>
                      {alerts}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="connect-sidebar__foot">
          <Link to="/" className="small">← Back to the TERESA site</Link>
        </div>
      </aside>

      <div className="connect-main">
        <header className="connect-header">
          <div className="connect-header__title">
            <h1>TERESA Connect</h1>
            <div className="connect-header__badges">
              <SimBadge />
              <span className="tag tag-neutral" title="Data source">
                Mode: Demo
              </span>
              <span className="tag tag-neutral" title="Hardware telemetry">
                Hardware: not connected
              </span>
            </div>
          </div>
          <dl className="connect-header__meta">
            <div>
              <dt>Selected unit</dt>
              <dd>
                {u.label} · {u.bed}
              </dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd className={`cond-${u.condition}`}>{statusLabel(u)}</dd>
            </div>
            <div>
              <dt>Sim time</dt>
              <dd className="num">
                {fmtSimTime(ward.t)} · ×{meta.speed}
                {!meta.running && " · paused"}
              </dd>
            </div>
            <div>
              <dt>Last update</dt>
              <dd className="num">{new Date(meta.updatedAt).toLocaleTimeString()}</dd>
            </div>
          </dl>
        </header>

        <FleetSelector ward={ward} selected={unitId} onSelect={select} />

        <div id="connect-main" className="connect-content" role="tabpanel" aria-labelledby={`unit-tab-${unitId}`} tabIndex={-1}>
          <Outlet context={ctx} />
        </div>
        <footer className="connect-footer">
          <Disclaimer compact />
          <p className="small muted">
            All values on this dashboard come from a deterministic simulation (time-compressed). They are not sensor readings.
          </p>
        </footer>
      </div>
    </div>
  );
}
