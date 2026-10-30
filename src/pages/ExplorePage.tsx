import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StatusTag } from "../components/StatusTag";
import { SystemDiagram, WorkflowDiagram } from "../components/Diagrams";
import { Disclaimer } from "../components/Disclaimer";
import { ENGINEERING, PAPER_AUTHORS, PAPER_TITLE, PUBLIC_STEPS, PUBLISHED_FEATURES, RELATED_WORK, STATUS_TODAY, type Item, type Step } from "../content/public";

interface FullContent {
  PROPOSED_FEATURES: Item[];
  FULL_STEPS: Step[];
  FULL_ENGINEERING: Record<string, string[]>;
}

/** Proposed-design content, loaded only in the private build. */
function useFullContent(): FullContent | null {
  const [full, setFull] = useState<FullContent | null>(null);
  useEffect(() => {
    if (!__TERESA_FULL__) return;
    let alive = true;
    import("@private/content").then((m) => {
      if (alive) setFull(m);
    });
    return () => {
      alive = false;
    };
  }, []);
  return full;
}

const SECTIONS = [
  { id: "problem", n: "01", label: "The problem" },
  { id: "overview", n: "02", label: "Project overview" },
  { id: "invention", n: "03", label: "The invention" },
  { id: "how-it-works", n: "04", label: "How TERESA works" },
  { id: "technology", n: "05", label: "Engineering" },
  { id: "research", n: "06", label: "Research" },
];

export default function ExplorePage() {
  const full = useFullContent();
  const steps = full?.FULL_STEPS ?? PUBLIC_STEPS;
  const [step, setStep] = useState(0);
  const cur = steps[Math.min(step, steps.length - 1)];

  return (
    <div className="explore">
      <header className="page-head">
        <div className="container">
          <p className="eyebrow">Explore TERESA</p>
          <h1>Smart self-disposing and sterilizing</h1>
          <p className="lead">
            The problem TERESA addresses, how the system is meant to work, what the published research covers, and what is still to be built and tested.
          </p>
          <div className="legend" aria-label="Status labels used on this page">
            <span><StatusTag status="proposed" /> design decision, not built</span>
          </div>
        </div>
      </header>

      <div className="container explore__layout">
        <nav className="explore__toc" aria-label="On this page">
          <ol>
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`}>
                  <span className="num">{s.n}</span>{s.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="explore__body">
          <section id="problem" className="xsection">
            <p className="xsection__n">01</p>
            <h2>The problem</h2>
            <p>
              Patients who are bedridden or have limited mobility often rely on a urinary catheter and a drainage bag. Someone has to empty, carry and dispose of the
              collected urine many times a day. That repeated manual handling takes caregiver time, is unpleasant for patients, and every handling step is a chance for
              spills and contamination.
            </p>
            <p>
              TERESA explores whether an assistive robot can take over the routine part of this job — collecting, carrying to a disposal point and emptying — so that
              caregivers handle the fluid less often, while the patient-side connection stays fixed at the bedside.
            </p>
            <p>
              Existing work on assistive urine management falls into two groups. Stationary bedside systems collect automatically — by vacuum suction from a diaper cup,
              or by collecting and then washing and drying — but the collected fluid still has to be carried away by hand. One mobile concept, AMURS, uses an automated
              guided vehicle to carry urine from the bed to a disposal point in an ICU, but it has no treatment stage after disposal.
            </p>
            <p>
              TERESA brings the three jobs together in one coordinated system: continuous collection at the bedside, autonomous self-disposal by a mobile unit, and a
              UV-C treatment stage inside the tank after each trip. The aim is to remove the routine handling from the caregiver&apos;s day without removing the caregiver
              from the loop: every fault, overflow risk and blocked path raises an alert for a person to act on.
            </p>
          </section>

          <section id="overview" className="xsection">
            <p className="xsection__n">02</p>
            <h2>Project overview</h2>
            <p>
              TERESA has two parts. A <strong>bedside part</strong> stays fixed beside the bed and collects from the patient line. A <strong>mobile unit</strong> carries
              the collected urine to a designated disposal point, empties, and returns to dock and recharge. Because the bedside part keeps collecting while the mobile unit
              is away, collection is not interrupted by the trip.
            </p>
            <SystemDiagram />
            <div className="goals">
              <h3>Design goals</h3>
              <ul>
                <li>Reduce repeated manual handling of collected urine.</li>
                <li>Keep collecting while the mobile unit is away.</li>
                <li>Fail-safe level sensing with an independent overflow backup.</li>
                <li>Autonomous travel with obstacle detection, and reliable docking.</li>
                <li>A post-use treatment stage inside the tank (UV-C), subject to validation.</li>
              </ul>
              <p className="small muted">Intended settings: hospital wards and home care. TERESA has not been used with patients.</p>
            </div>
          </section>

          <section id="invention" className="xsection">
            <p className="xsection__n">03</p>
            <h2>The invention</h2>
            <p>What the published paper describes:</p>
            <ul className="features">
              {PUBLISHED_FEATURES.map((f) => (
                <li key={f.title} className="feature">
                  <div className="feature__head">
                    <h3>{f.title}</h3>
                    <StatusTag status={f.status} />
                  </div>
                  <p className="muted">{f.text}</p>
                </li>
              ))}
            </ul>
            {full ? (
              <>
                <h3 className="sub">Design development since the paper</h3>
                <p className="muted small">New design decisions. None of these has been built or tested.</p>
                <ul className="features">
                  {full.PROPOSED_FEATURES.map((f) => (
                    <li key={f.title} className="feature">
                      <div className="feature__head">
                        <h3>{f.title}</h3>
                        <StatusTag status={f.status} />
                      </div>
                      <p className="muted">{f.text}</p>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="small muted">Design development since the paper is ongoing and will be published later.</p>
            )}
          </section>

          <section id="how-it-works" className="xsection">
            <p className="xsection__n">04</p>
            <h2>How TERESA works</h2>
            <div className="workflow">
              <WorkflowDiagram pos={cur.pos} step={step} />
              <div className="workflow__step" aria-live="polite">
                <div className="workflow__meta">
                  <span className="num muted">
                    Step {step + 1} of {steps.length}
                  </span>
                  <StatusTag status={cur.status} />
                </div>
                <h3>{cur.title}</h3>
                <p className="muted">{cur.text}</p>
              </div>
              <div className="workflow__nav">
                <button type="button" className="btn btn-sm" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
                  Previous
                </button>
                <ol className="workflow__dots" aria-label="Steps">
                  {steps.map((s, i) => (
                    <li key={s.title}>
                      <button type="button" aria-label={`Step ${i + 1}: ${s.title}`} aria-current={i === step ? "step" : undefined} onClick={() => setStep(i)} />
                    </li>
                  ))}
                </ol>
                <button type="button" className="btn btn-sm" onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))} disabled={step === steps.length - 1}>
                  Next
                </button>
              </div>
              <p className="small">
                <Link to="/connect/simulation?unit=teresa-2">See this cycle in the TERESA Connect ward simulation</Link>
              </p>
            </div>
          </section>

          <section id="technology" className="xsection">
            <p className="xsection__n">05</p>
            <h2>Engineering and components</h2>
            <div className="accordion">
              {ENGINEERING.map((m) => (
                <details key={m.id} className="accordion__item">
                  <summary>
                    <span>{m.title}</span>
                  </summary>
                  <div className="accordion__body">
                    <div className="accordion__group">
                      <StatusTag status="published" />
                      <ul>{m.published.map((t) => <li key={t}>{t}</li>)}</ul>
                    </div>
                    {full?.FULL_ENGINEERING[m.id] && (
                      <div className="accordion__group">
                        <StatusTag status="proposed" />
                        <ul>{full.FULL_ENGINEERING[m.id].map((t) => <li key={t}>{t}</li>)}</ul>
                      </div>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </section>

          <section id="research" className="xsection">
            <p className="xsection__n">06</p>
            <h2>Research, validation and development</h2>

            <h3 className="sub">Abstract</h3>
            <p>
              Bedridden and mobility-limited patients who use a urinary catheter depend on caregivers to empty, carry and dispose of the collected urine many times a
              day — repetitive work that costs nursing time and creates repeated chances for spills and contamination. TERESA is a smart self-disposing and sterilizing
              urine collector that automates this routine. A bedside part collects continuously from the patient line into a level-monitored tank with an independent
              overflow sensor. When the tank reaches its threshold, a mobile unit carries the collected urine to a designated disposal point, empties it and returns to
              dock, while the bedside part keeps collecting. After docking, a UV-C stage runs inside the tank. The stages are coordinated by a finite-state machine with
              fail-safe sensing. A prototype built on an Arduino controller with an Adafruit V1 motor shield demonstrated level sensing, line-following navigation with
              infrared obstacle detection, and the disposal and UV-C stages as timed state transitions. The results support the feasibility of the concept; mechanical
              disposal, map-based navigation and UV-C efficacy remain to be built and validated.
            </p>

            <h3 className="sub">Objectives</h3>
            <ul>
              <li>Automate urine collection from the patient line into a monitored tank.</li>
              <li>Carry collected urine autonomously to a disposal point and return without interrupting collection.</li>
              <li>Add a post-use UV-C treatment stage inside the tank.</li>
              <li>Coordinate the stages with a finite-state machine and fail-safe sensing.</li>
            </ul>

            <h3 className="sub">Methodology and prototype (as published)</h3>
            <ul>
              <li>Arduino controller with an Adafruit V1 motor shield; 7.4 V main battery; 5.00 V logic rail.</li>
              <li>Path-following algorithm with line/IR sensors; IR obstacle readings of 25 cm and 27 cm reported.</li>
              <li>Level sensing reported as a raw ADC value of 381 corresponding to 30.2% fluid level (calibration formula not given).</li>
              <li>Disposal and UV-C stages demonstrated as timed logical state transitions (about 20 s in total), not mechanical operation.</li>
            </ul>
            <p className="small muted">
              The paper also reports navigation accuracy percentages. They are not repeated here until the underlying test data has been checked.
            </p>

            <h3 className="sub">Proposed testing procedure</h3>
            <div className="feature__head" style={{ marginBottom: 8 }}>
              <StatusTag status="proposed" />
            </div>
            <ol>
              <li>Level-sensor calibration across the tank range, and overflow-sensor response.</li>
              <li>Navigation repeatability and docking position tolerance over repeated cycles.</li>
              <li>Disposal-mechanism leak and residual-volume tests (bench first, no patient).</li>
              <li>UV-C irradiance at the tank surfaces and swab tests before any efficacy statement.</li>
              <li>Battery endurance against a measured duty cycle.</li>
              <li>Fault-injection tests for every alarm and interlock.</li>
            </ol>

            <h3 className="sub">Current limitations</h3>
            <ul>{STATUS_TODAY.notYet.map((s) => <li key={s}>{s}</li>)}</ul>

            <h3 className="sub">Future development</h3>
            <ul>
              <li>Build and bench-test a mechanical prototype of the bedside part and the mobile unit.</li>
              <li>Replace line following with map-based navigation and obstacle avoidance.</li>
              <li>Connect real telemetry to TERESA Connect.</li>
              <li>Engineering verification and risk assessment before any clinical evaluation.</li>
            </ul>

            <h3 className="sub">Related work discussed in the paper</h3>
            <ul className="refs">
              {RELATED_WORK.map((r) => (
                <li key={r.who}>
                  <strong>{r.who}</strong> — {r.what}
                </li>
              ))}
            </ul>
            <p className="small muted">The complete reference list, with full bibliographic details for each work above, is given in the paper.</p>

            <h3 className="sub">Cite the paper</h3>
            <p className="cite">
              {PAPER_AUTHORS}. <em>{PAPER_TITLE}.</em> Presented at a national conference, Loyola College, Chennai, 2026.
            </p>
          </section>

          <Disclaimer />
        </div>
      </div>
    </div>
  );
}
