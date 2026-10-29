/**
 * PUBLIC content. Only what the published conference paper discloses, plus
 * clearly-labelled status statements. Nothing here describes the proposed
 * (unfiled) design. See content/full.ts for private-build details.
 */
import type { ContentStatus } from "../components/StatusTag";

export interface Item {
  title: string;
  text: string;
  status: ContentStatus;
}

export const PUBLISHED_FEATURES: Item[] = [
  { title: "Patient-side collection", text: "A silicone tube carries urine from the patient line to an upper buffer, then to the inner collection tank.", status: "published" },
  { title: "Level sensing with a backup", text: "An ultrasonic sensor measures the tank level. A separate overflow sensor acts as a fail-safe backup.", status: "published" },
  { title: "Detachable inner tank unit", text: "When the level threshold is reached, the inner tank unit detaches and travels to a designated disposal location, while the outer part keeps collecting.", status: "published" },
  { title: "Disposal and return", text: "At the disposal location the inner tank is emptied, then the unit returns to its base. The paper does not describe the emptying mechanism.", status: "published" },
  { title: "Navigation and safety sensing", text: "Path following (line/IR sensors), IR obstacle sensing, and load/tilt sensing for stability. Docking and undocking follow a finite-state machine.", status: "published" },
  { title: "Wireless charging", text: "The mobile unit charges wirelessly at its docking station.", status: "published" },
  { title: "UV-C stage", text: "UV-C LEDs (260–280 nm) inside the stainless tank run for a fixed duration after docking. No dose or efficacy has been validated.", status: "published" },
];

export const STATUS_TODAY = {
  exists: [
    "Published conference paper describing the concept (2026).",
    "A path-following prototype module (Arduino-based). Work on it is paused.",
    "This website and its simulation (TERESA Connect).",
  ],
  notYet: [
    "A mechanical prototype of the bedside dock, the disposal mechanism, or the tank.",
    "Measured disposal or leak performance.",
    "A validated UV-C dose or any disinfection result.",
    "Any clinical evaluation, approval or patient use.",
  ],
};

export interface Step {
  title: string;
  text: string;
  status: ContentStatus;
  /** Robot position in the workflow diagram: 0 = docked … 1 = at the disposal point. */
  pos: number;
}

export const PUBLIC_STEPS: Step[] = [
  { title: "Patient line connects at the bedside", text: "The patient-side tube connects to the bedside part of TERESA, which stays fixed beside the bed.", status: "published", pos: 0 },
  { title: "Urine collects in the upper buffer", text: "Collected urine enters the upper buffer. Level sensing watches for the transfer threshold.", status: "published", pos: 0 },
  { title: "Transfer to the inner tank", text: "Urine moves from the buffer into the inner collection tank.", status: "published", pos: 0 },
  { title: "The inner tank unit detaches", text: "When the tank threshold is reached, the mobile unit detaches. The bedside part keeps collecting.", status: "published", pos: 0.1 },
  { title: "Navigates to the disposal point", text: "The unit follows its path to the designated disposal location, stopping for obstacles.", status: "published", pos: 0.55 },
  { title: "Empties at the disposal point", text: "The tank is emptied. In the paper this stage was shown as a timed logic transition, not mechanical operation.", status: "untested", pos: 1 },
  { title: "Returns and docks", text: "The unit returns to its bedside dock and wireless charging resumes.", status: "published", pos: 0.45 },
  { title: "UV-C stage after docking", text: "UV-C runs for a fixed duration inside the tank. Dose, coverage and safety have not been validated.", status: "untested", pos: 0 },
  { title: "Back to collecting", text: "The cycle completes and the unit resumes monitoring.", status: "published", pos: 0 },
];

export interface EngineeringModule {
  id: string;
  title: string;
  published: string[];
}

export const ENGINEERING: EngineeringModule[] = [
  { id: "mechanical", title: "Mechanical design", published: ["Fixed bedside part plus a detachable inner tank unit that travels.", "Stainless inner tank housing the UV-C LEDs."] },
  { id: "fluid", title: "Fluid collection and disposal", published: ["Silicone patient tube → upper buffer → inner collection tank.", "Emptying at a designated disposal location. The mechanism is not described in the paper and has not been built."] },
  { id: "sensors", title: "Sensors and navigation", published: ["Ultrasonic tank level sensing with a backup overflow sensor.", "IR obstacle sensors (prototype readings of 25 cm and 27 cm reported).", "Load/tilt sensing for stability.", "Path-following algorithm using line/IR sensors."] },
  { id: "control", title: "Embedded control", published: ["Prototype controller: Arduino with an Adafruit V1 motor shield.", "Finite-state machine coordinating collection, travel, docking and the UV-C stage."] },
  { id: "power", title: "Power management", published: ["Prototype: 7.4 V main battery and a 5.00 V logic rail.", "No power budget for a full system has been published."] },
  { id: "docking", title: "Docking and charging", published: ["Wireless charging at the docking station.", "Docking and undocking guided by navigation sensors and the state machine."] },
  { id: "uv", title: "Cleaning and UV-C safety", published: ["UV-C LEDs (260–280 nm) inside the tank, run after docking for a fixed duration.", "The paper also mentions spray as an alternative.", "No UV-C dose, exposure or disinfection result has been measured. TERESA makes no sterilisation claim."] },
  { id: "software", title: "Software architecture", published: ["Prototype firmware implements path following and the state transitions.", "TERESA Connect (this site) runs a separate, deterministic simulation with a typed data layer, so that real telemetry can be connected later."] },
  { id: "monitoring", title: "Monitoring and alerts", published: ["Level, overflow and obstacle conditions are monitored by the state machine.", "TERESA Connect shows simulated status, faults and alerts for five units. It is not connected to hardware."] },
];

export const RELATED_WORK = [
  { who: "Fujimoto et al.", what: "Stationary urine collection using a diaper cup and vacuum suction." },
  { who: "Jeong et al. (Care Clean III)", what: "Stationary system that washes and dries after collection." },
  { who: "Hu et al.", what: "Bedside detection using multi-sensor fusion." },
  { who: "Han et al. (AMURS)", what: "An automated guided vehicle carrying urine from the bed to a disposal point in an ICU — the closest related mobile concept; it did not include a treatment stage." },
];

export const PAPER_AUTHORS = "Iesvs Immanuel AJ, Tatwin Shelian A, Pauline Samyuktha R, Karthickeyan SP (supervisor: Dr. Shobana G)";
