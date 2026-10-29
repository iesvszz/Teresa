import { Link } from "react-router-dom";
import { Disclaimer } from "../components/Disclaimer";
import { STATUS_TODAY } from "../content/public";

export default function AboutPage() {
  return (
    <div>
      <header className="page-head">
        <div className="container narrow">
          <p className="eyebrow">About</p>
          <h1>About TERESA</h1>
          <p className="lead">
            TERESA is an assistive healthcare robotics research project. It began as a student project, was presented at a national conference in 2026, and is now being
            developed towards a physical prototype.
          </p>
        </div>
      </header>
      <section className="section section--tight">
        <div className="container narrow prose">
          <h2>What this site is</h2>
          <p>
            This site explains the TERESA concept and the published research. It also includes <Link to="/connect">TERESA Connect</Link>, a monitoring dashboard driven
            entirely by a simulation of five units in a hospital ward. No hardware is connected and no real data is shown.
          </p>
          <h2>Status</h2>
          <ul>{STATUS_TODAY.exists.map((s) => <li key={s}>{s}</li>)}</ul>
          <p>Not yet done:</p>
          <ul>{STATUS_TODAY.notYet.map((s) => <li key={s}>{s}</li>)}</ul>
          <h2>Team</h2>
          <div className="placeholder">
            <strong>[Placeholder — to be added]</strong> Team members and roles.
          </div>
          <h2>Contact</h2>
          <div className="placeholder">
            <strong>[Placeholder — to be added]</strong> Project contact address.
          </div>
          <Disclaimer />
        </div>
      </section>
    </div>
  );
}
