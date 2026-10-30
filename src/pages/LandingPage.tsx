import { Suspense, lazy } from "react";
import { Link } from "react-router-dom";
import { HeroFallback } from "../three/HeroFallback";
import { STATUS_TODAY } from "../content/public";
import Folder from "../components/ui/Folder";

const HeroRobot = lazy(() => import("../three/HeroRobot"));

const BLOCKS = [
  { n: "01", title: "Collect", text: "A bedside part stays beside the patient and collects through the patient line, with level sensing and an independent overflow sensor." },
  { n: "02", title: "Dispose", text: "When the tank threshold is reached, a detachable mobile unit travels to a designated disposal point, empties, and returns — while the bedside part keeps collecting." },
  { n: "03", title: "Treat", text: "After docking and recharging wirelessly, a UV-C stage runs inside the tank. Its dose and efficacy have not been validated." },
];

const FLOW = ["Collect at the bedside", "Transfer to the tank", "Detach and navigate", "Empty at the disposal point", "Return and dock", "UV-C stage"];

const pad = (i: number) => String(i + 1).padStart(2, "0");

export default function LandingPage() {
  return (
    <>
      <section className="fx-hero">
        <div className="container fx-hero__grid">
          <div className="fx-hero__copy">
            <p className="fx-label">Assistive robotics · Research prototype</p>
            <h1 className="fx-display">
              Autonomous urine collection.
              <span className="fx-display__dim"> Intelligent self&#8209;disposal.</span>
            </h1>
            <p className="fx-lead">
              An assistive robotics concept that automates urine collection, disposal and post-use treatment through a bedside dock and an autonomous mobile unit.
            </p>
            <div className="fx-actions">
              <Link to="/explore" className="fx-btn fx-btn--solid">Explore TERESA</Link>
              <Link to="/connect" className="fx-btn">Open TERESA Connect</Link>
            </div>
          </div>

          <figure className="fx-frame fx-hero__visual">
            <span className="fx-frame__corner fx-frame__corner--tl" aria-hidden="true" />
            <span className="fx-frame__corner fx-frame__corner--tr" aria-hidden="true" />
            <span className="fx-frame__corner fx-frame__corner--bl" aria-hidden="true" />
            <span className="fx-frame__corner fx-frame__corner--br" aria-hidden="true" />
            <div className="fx-hero__stage">
              <Suspense fallback={<HeroFallback />}>
                <HeroRobot />
              </Suspense>
            </div>
            <figcaption className="fx-frame__caption">
              <span>Mobile unit</span>
              <span>Conceptual model · not to scale</span>
            </figcaption>
          </figure>
        </div>
        <p className="container fx-hero__note">Research prototype concept — not a medical device.</p>
      </section>

      <section className="fx-section">
        <div className="container">
          <header className="fx-head">
            <p className="fx-label">01 — The concept</p>
            <h2 className="fx-title">Three jobs, one coordinated system.</h2>
          </header>
          <div className="fx-folder">
            <Folder
              label="TERESA"
              color="#0a84ff"
              theme="light"
              size={1.7}
              tilt={0.4}
              draggable={false}
              items={BLOCKS.map((b) => (
                <article key={b.n} className="fx-page">
                  <span className="fx-page__n">{b.n}</span>
                  <h3 className="fx-page__title">{b.title}</h3>
                  <p className="fx-page__text">{b.text}</p>
                </article>
              ))}
            />
            <p className="fx-folder__hint">Open the folder · click a page to read it</p>
          </div>
        </div>
      </section>

      <section className="fx-section fx-section--alt">
        <div className="container">
          <header className="fx-head fx-head--split">
            <div>
              <p className="fx-label">02 — The cycle</p>
              <h2 className="fx-title">Bed to disposal point, and back.</h2>
            </div>
            <Link to="/explore#how-it-works" className="fx-link">See the full workflow</Link>
          </header>
          <ol className="fx-track">
            {FLOW.map((f, i) => (
              <li key={f}>
                <span className="fx-track__n">{pad(i)}</span>
                <span className="fx-track__label">{f}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="fx-section">
        <div className="container">
          <header className="fx-head">
            <p className="fx-label">03 — Honest status</p>
            <h2 className="fx-title">Where TERESA is today.</h2>
          </header>
          <div className="fx-ledger">
            <div>
              <h3 className="fx-ledger__title">Exists</h3>
              <ol className="fx-list">
                {STATUS_TODAY.exists.map((s, i) => (
                  <li key={s}><span className="fx-list__n">{pad(i)}</span>{s}</li>
                ))}
              </ol>
            </div>
            <div>
              <h3 className="fx-ledger__title">Not yet</h3>
              <ol className="fx-list fx-list--dim">
                {STATUS_TODAY.notYet.map((s, i) => (
                  <li key={s}><span className="fx-list__n">{pad(i)}</span>{s}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className="fx-section fx-section--flush">
        <div className="container">
          <div className="fx-panel">
            <div className="fx-panel__copy">
              <p className="fx-label fx-label--light">04 — TERESA Connect</p>
              <h2 className="fx-title">A live ward, simulated.</h2>
              <p>
                Five simulated TERESA units work a hospital ward in real time — collection, travel to the disposal point, return, docking and the UV-C stage — with faults you
                can trigger yourself.
              </p>
            </div>
            <Link to="/connect/simulation" className="fx-btn fx-btn--light">Open the live simulation</Link>
          </div>
        </div>
      </section>
    </>
  );
}
