import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Activity, ArrowLeft, Bell, Bot, Home, Info, LayoutDashboard, Menu, MonitorPlay, PanelLeftClose, PanelLeftOpen, Settings, X } from "lucide-react";
import { useSelectedUnit, useSim } from "../teresa/hooks";
import { activeAlertCount } from "../teresa/selectors";
import { TeresaWordmark } from "../components/TeresaWordmark";
import { Disclaimer } from "../components/Disclaimer";
import { UnitList } from "./components/UnitList";
import type { ConnectContext } from "./context";

const ICON = { size: 18, strokeWidth: 1.75, "aria-hidden": true } as const;

const NAV = [
  { to: "/connect", label: "Overview", Icon: LayoutDashboard, end: true },
  { to: "/connect/fleet", label: "TERESA Fleet", Icon: Bot },
  { to: "/connect/simulation", label: "Live Simulation", Icon: MonitorPlay },
  { to: "/connect/activity", label: "Activity", Icon: Activity },
  { to: "/connect/alerts", label: "Alerts", Icon: Bell, alerts: true },
  { to: "/connect/system", label: "System Information", Icon: Info },
  { to: "/connect/settings", label: "Settings", Icon: Settings },
];

/** Title and one-line description for each Connect page. */
const PAGES: Record<string, { title: string; desc: string }> = {
  "/connect": { title: "Overview", desc: "The selected unit at a glance, with the ward's alerts and recent events." },
  "/connect/fleet": { title: "Fleet", desc: "All five units side by side." },
  "/connect/simulation": { title: "Live simulation", desc: "The ward in 3D. Drive the selected unit's workflow and inject faults." },
  "/connect/activity": { title: "Activity", desc: "Every event the simulation has logged, newest first." },
  "/connect/alerts": { title: "Alerts", desc: "Overflow, faults and safety events that need attention." },
  "/connect/system": { title: "System", desc: "Where the data comes from and the rules the simulation follows." },
  "/connect/settings": { title: "Settings", desc: "Simulation speed, thresholds and display options." },
};

const STORAGE_KEY = "teresa.connect.sidebar";
const MOBILE = "(max-width: 900px)";

/** Desktop: sidebar expanded or collapsed to an icon rail (remembered). Mobile: off-canvas drawer. */
function useSidebar() {
  const [mobile, setMobile] = useState(() => window.matchMedia(MOBILE).matches);
  const [expanded, setExpanded] = useState(() => localStorage.getItem(STORAGE_KEY) !== "collapsed");
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE);
    const on = () => setMobile(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, expanded ? "expanded" : "collapsed");
  }, [expanded]);

  return { mobile, expanded, setExpanded, drawer, setDrawer };
}

export default function ConnectLayout() {
  const [unitId, select] = useSelectedUnit();
  const { ward } = useSim();
  const { pathname } = useLocation();
  const page = PAGES[pathname.replace(/\/$/, "")] ?? PAGES["/connect"];
  const { mobile, expanded, setExpanded, drawer, setDrawer } = useSidebar();
  const search = `?unit=${unitId}`;
  const alerts = activeAlertCount(ward);
  const ctx: ConnectContext = { unitId, select, search };

  const closeDrawer = () => setDrawer(false);

  const showLabels = mobile || expanded;
  const sidebarClass = ["connect-sidebar", !mobile && !expanded && "is-collapsed", mobile && drawer && "is-open"].filter(Boolean).join(" ");

  return (
    <div className={`connect${!mobile && !expanded ? " connect--collapsed" : ""}`}>
      <a href="#connect-main" className="skip-link">Skip to dashboard</a>

      {mobile && drawer && <div className="connect-backdrop" onClick={() => setDrawer(false)} aria-hidden="true" />}

      <aside id="connect-sidebar" className={sidebarClass} aria-label="TERESA Connect">
        <div className="connect-sidebar__top">
          {showLabels && (
            <Link to="/connect" className="connect-sidebar__brand" aria-label="TERESA Connect overview">
              <TeresaWordmark height={13} />
              <span>Connect</span>
            </Link>
          )}
          {mobile ? (
            <button type="button" className="connect-icon-btn" onClick={() => setDrawer(false)} aria-label="Close menu">
              <X {...ICON} />
            </button>
          ) : (
            <button
              type="button"
              className="connect-icon-btn"
              onClick={() => setExpanded((v) => !v)}
              aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
              aria-expanded={expanded}
              aria-controls="connect-sidebar"
              title={expanded ? "Collapse sidebar" : "Expand sidebar"}
            >
              {expanded ? <PanelLeftClose {...ICON} /> : <PanelLeftOpen {...ICON} />}
            </button>
          )}
        </div>

        <nav aria-label="Dashboard">
          <ul>
            {NAV.map(({ to, label, Icon, end, alerts: hasAlerts }) => (
              <li key={to}>
                <NavLink
                  to={{ pathname: to, search }}
                  end={end}
                  className={({ isActive }) => (isActive ? "is-active" : undefined)}
                  onClick={closeDrawer}
                  title={showLabels ? undefined : label}
                  aria-label={showLabels ? undefined : label}
                >
                  <span className="connect-nav__icon">
                    <Icon {...ICON} />
                    {hasAlerts && alerts > 0 && !showLabels && <span className="nav-pip" aria-hidden="true" />}
                  </span>
                  {showLabels && <span className="connect-nav__label">{label}</span>}
                  {hasAlerts && alerts > 0 && showLabels && (
                    <span className="nav-count" aria-label={`${alerts} active alerts`}>
                      {alerts}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <UnitList ward={ward} selected={unitId} onSelect={select} compact={!showLabels} />

        <div className="connect-sidebar__foot">
          <Link to="/home" onClick={closeDrawer} title={showLabels ? undefined : "Back to the TERESA site"} aria-label={showLabels ? undefined : "Back to the TERESA site"}>
            <span className="connect-nav__icon"><ArrowLeft {...ICON} /></span>
            {showLabels && <span>Back to the TERESA site</span>}
          </Link>
        </div>
      </aside>

      <div className="connect-main">
        <header className="connect-header">
          {mobile && (
            <button type="button" className="connect-icon-btn" onClick={() => setDrawer(true)} aria-label="Open menu" aria-expanded={drawer} aria-controls="connect-sidebar">
              <Menu {...ICON} />
            </button>
          )}
          <div className="connect-header__text">
            <h1>{page.title}</h1>
            <p>{page.desc}</p>
          </div>
          <div className="connect-header__aside">
            <span className="connect-header__sim" title="All values are simulated — not sensor data">Simulated</span>
            <Link to="/home" className="connect-header__site">
              <Home {...ICON} size={16} />
              <span>TERESA site</span>
            </Link>
          </div>
        </header>

        <div id="connect-main" className="connect-content" tabIndex={-1}>
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
