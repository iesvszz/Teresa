import { Link } from "react-router-dom";
import { TeresaWordmark } from "./TeresaWordmark";
import { Disclaimer } from "./Disclaimer";

const YEAR = new Date().getFullYear();

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__top">
          <div>
            <TeresaWordmark height={14} />
            <p className="small muted" style={{ marginTop: 10 }}>
              Autonomous Urine Collector with Self-Disposal and UV-C Treatment — research prototype concept.
            </p>
          </div>
          <nav aria-label="Footer">
            <ul className="site-footer__links">
              <li><Link to="/explore">Explore</Link></li>
              <li><Link to="/explore#research">Research</Link></li>
              <li><Link to="/connect">TERESA Connect</Link></li>
              <li><Link to="/about">About</Link></li>
            </ul>
          </nav>
        </div>
        <Disclaimer compact />
        <p className="small muted">© {YEAR} TERESA project. All dashboard data on this site is simulated.</p>
      </div>
    </footer>
  );
}
