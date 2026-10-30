import { Link } from "react-router-dom";
import { Disclaimer } from "../components/Disclaimer";
import { PAPER_TITLE, STATUS_TODAY } from "../content/public";

const TEAM = ["Iesvs Immanuel AJ", "Tatwin Shelian A", "Pauline Samyuktha R", "Karthickeyan SP"];

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
          <p>The authors of the paper <em>{PAPER_TITLE}</em>:</p>
          <ul>
            {TEAM.map((name) => <li key={name}>{name}</li>)}
          </ul>
          <p>Supervised by Dr. Shobana G.</p>
          <h2>Contact</h2>
          <p>
            For questions about TERESA, the paper or collaboration on the physical prototype, contact the first author, Iesvs Immanuel AJ. The paper was presented at a
            national conference at Loyola College, Chennai, in 2026.
          </p>
          <Disclaimer />
        </div>
      </section>
    </div>
  );
}
