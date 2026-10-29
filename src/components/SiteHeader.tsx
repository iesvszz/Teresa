import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { TeresaWordmark } from "./TeresaWordmark";

const LINKS = [
  { to: "/explore", label: "Explore" },
  { to: "/explore#technology", label: "Technology" },
  { to: "/explore#research", label: "Research" },
  { to: "/about", label: "About" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname, location.hash]);

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link to="/" className="site-header__brand" aria-label="TERESA home">
          <TeresaWordmark height={17} />
        </Link>
        <button
          type="button"
          className="site-header__toggle btn btn-ghost btn-sm"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            {open ? <path d="M4 4 L16 16 M16 4 L4 16" stroke="currentColor" strokeWidth="1.6" /> : <path d="M3 6 H17 M3 10 H17 M3 14 H17" stroke="currentColor" strokeWidth="1.6" />}
          </svg>
        </button>
        <nav id="site-nav" className={`site-nav${open ? " is-open" : ""}`} aria-label="Main">
          <ul>
            {LINKS.map((l) => (
              <li key={l.label}>
                <NavLink
                  to={l.to}
                  className={({ isActive }) => (isActive && !l.to.includes("#") && location.hash === "" ? "is-active" : undefined)}
                  end
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
            <li>
              <Link to="/connect" className="btn btn-outline-accent btn-sm site-nav__connect">
                TERESA Connect
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
