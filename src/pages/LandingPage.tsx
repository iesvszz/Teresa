import { Suspense, lazy } from "react";
import { Link } from "react-router-dom";
import { TeresaWordmark } from "../components/TeresaWordmark";
import { HeroFallback } from "../three/HeroFallback";
import { STATUS_TODAY } from "../content/public";

const HeroRobot = lazy(() => import("../three/HeroRobot"));

const BLOCKS = [
  { n: "01", title: "Collect", text: "A bedside part stays beside the patient and collects through the patient line, with level sensing and an independent overflow sensor." },
  { n: "02", title: "Dispose", text: "When the tank threshold is reached, a detachable mobile unit travels to a designated disposal point, empties, and returns — while the bedside part keeps collecting." },
  { n: "03", title: "Treat", text: "After docking and recharging wirelessly, a UV-C stage runs inside the tank. Its dose and efficacy have not been validated." },
];

const FLOW = ["Collect at the bedside", "Transfer to the tank", "Detach and navigate", "Empty at the disposal point", "Return and dock", "UV-C stage"];

export default function LandingPage() {
  return (
    <>
      <section className="hero">
        <div className="container hero__grid">
          <div className="hero__copy">
            <h1 className="sr-only">TERESA</h1>
            <TeresaWordmark className="hero__wordmark" height={46} />
            <p className="hero__tagline">Autonomous Urine Collection. Intelligent Self-Disposal.</p>
            <p className="lead">
              An assistive robotics concept designed to automate urine collection, disposal, and post-use treatment through a bedside dock and an autonomous mobile unit.
            </p>
            <div className="hero__ctas">
              <Link to="/explore" className="btn btn-primary">Explore TERESA</Link>
              <Link to="/connect" className="btn">Open TERESA Connect</Link>
            </div>
            <p className="small muted hero__note">Research prototype concept · not a medical device</p>
          </div>
          <div className="hero__visual">
            <Suspense fallback={<HeroFallback />}>
              <HeroRobot />
            </Suspense>
            <span className="hero__caption small muted">TERESA mobile unit — conceptual 3D model, not to scale</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <p className="eyebrow">The concept</p>
          <h2>Three jobs, one coordinated system</h2>
          <div className="blocks">
            {BLOCKS.map((b) => (
              <article key={b.n} className="block">
                <span className="block__n">{b.n}</span>
                <h3>{b.title}</h3>
                <p className="muted">{b.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--alt">
        <div className="container">
          <p className="eyebrow">How it works</p>
          <h2>One cycle, bed to disposal point and back</h2>
          <ol className="flow">
            {FLOW.map((f, i) => (
              <li key={f}>
                <span className="flow__n num">{i + 1}</span>
                <span>{f}</span>
              </li>
            ))}
          </ol>
          <Link to="/explore#how-it-works" className="btn btn-sm">See the full workflow</Link>
        </div>
      </section>

      <section className="section">
        <div className="container status-band">
          <div>
            <p className="eyebrow">Honest status</p>
            <h2>Where TERESA is today</h2>
            <p className="muted">TERESA is at the research stage. This is what exists and what does not.</p>
          </div>
          <div className="status-band__cols">
            <div>
              <h3>Exists</h3>
              <ul className="check-list">{STATUS_TODAY.exists.map((s) => <li key={s}>{s}</li>)}</ul>
            </div>
            <div>
              <h3>Not yet</h3>
              <ul className="cross-list">{STATUS_TODAY.notYet.map((s) => <li key={s}>{s}</li>)}</ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--dark">
        <div className="container cta-band">
          <div>
            <h2>TERESA Connect</h2>
            <p>Watch five simulated TERESA units work a hospital ward in real time: collection, travel to the disposal point, return, docking and the UV-C stage — with faults you can trigger yourself.</p>
          </div>
          <Link to="/connect/simulation" className="btn btn-light">Open the live simulation</Link>
        </div>
      </section>
    </>
  );
}
