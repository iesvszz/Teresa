import { describe, expect, it } from "vitest";
import { WardEngine } from "./engine";
import { STAGE_ORDER, UNIT_IDS, type Stage, type TeresaUnitId } from "./types";
import { SIM, WHEEL_POSITIONS, unitLayout } from "./model-config";
import { interlocks } from "./selectors";

/** Run the engine, calling `check` after every fixed step. */
function run(e: WardEngine, seconds: number, check?: (e: WardEngine) => void) {
  const steps = Math.round(seconds / SIM.fixedDt);
  for (let i = 0; i < steps; i++) {
    e.step(SIM.fixedDt);
    check?.(e);
  }
}

function stagesVisited(e: WardEngine, id: TeresaUnitId, seconds: number): Stage[] {
  const seen: Stage[] = [e.state.units[id].stage];
  run(e, seconds, (en) => {
    const s = en.state.units[id].stage;
    if (seen[seen.length - 1] !== s) seen.push(s);
  });
  return seen;
}

describe("model", () => {
  it("has exactly four wheels", () => {
    expect(WHEEL_POSITIONS.length).toBe(4);
  });
});

describe("workflow", () => {
  it("runs a full cycle in the documented order", () => {
    const e = new WardEngine({ rinseEnabled: true, uvEnabled: true });
    const seen = stagesVisited(e, "teresa-2", 400);
    const expected: Stage[] = ["undocking", "navigating", "positioning", "draining", "rinsing", "returning", "docking", "uv-treatment", "complete", "collecting"];
    expect(seen.slice(0, expected.length)).toEqual(expected);
    // visited stages always move forward in STAGE_ORDER within one trip
    const idx = expected.map((s) => STAGE_ORDER.indexOf(s));
    for (let i = 1; i < idx.length - 1; i++) expect(idx[i]).toBeGreaterThan(idx[i - 1]);
  });

  it("skips rinse and UV-C when disabled", () => {
    const e = new WardEngine({ rinseEnabled: false, uvEnabled: false });
    const seen = stagesVisited(e, "teresa-2", 300);
    expect(seen).not.toContain("rinsing");
    expect(seen).not.toContain("uv-treatment");
    expect(seen).toContain("complete");
  });

  it("moves continuously (no teleporting) and ends back in its dock", () => {
    const e = new WardEngine();
    let prev = { ...e.state.units["teresa-2"].pose };
    let maxJump = 0;
    run(e, 300, (en) => {
      const p = en.state.units["teresa-2"].pose;
      maxJump = Math.max(maxJump, Math.hypot(p.x - prev.x, p.z - prev.z));
      prev = { ...p };
    });
    // 1.5x peak of the fastest speed per step, with margin
    expect(maxJump).toBeLessThan(SIM.speeds.navigate * 1.6 * SIM.fixedDt);
    const u = e.state.units["teresa-2"];
    const dock = unitLayout(u.index).dock;
    expect(u.docked).toBe(true);
    expect(Math.hypot(u.pose.x - dock.x, u.pose.z - dock.z)).toBeLessThan(1e-6);
  });

  it("only one unit is ever away from its dock", () => {
    const e = new WardEngine();
    run(e, 1500, (en) => {
      const away = UNIT_IDS.filter((id) => !en.state.units[id].docked);
      expect(away.length).toBeLessThanOrEqual(1);
      if (away.length === 1) expect(en.state.drainHolder).toBe(away[0]);
    });
  });

  it("conserves volume: drained + tank = transferred + initial tank", () => {
    const e = new WardEngine();
    const initial = Object.fromEntries(UNIT_IDS.map((id) => [id, e.state.units[id].tankMl]));
    run(e, 900);
    for (const id of UNIT_IDS) {
      const u = e.state.units[id];
      expect(u.tankMl + u.totalDrainedMl).toBeCloseTo(initial[id] + u.totalTransferredMl, 3);
    }
  });
});

describe("interlocks", () => {
  it("disposal valve is never open unless positioned and checks pass", () => {
    const e = new WardEngine();
    let opened = 0;
    run(e, 900, (en) => {
      for (const id of UNIT_IDS) {
        const u = en.state.units[id];
        if (u.disposalValve === "open") {
          opened++;
          expect(u.positioned && u.checkOk && !u.estop).toBe(true);
          expect(u.docked).toBe(false);
        }
        if (u.transferValve === "open") expect(u.docked).toBe(true);
        if (u.uvOn) expect(interlocks(u).uv).toBe(true);
      }
    });
    expect(opened).toBeGreaterThan(0);
  });

  it("a failed disposal check keeps the valve closed and raises a fault", () => {
    const e = new WardEngine();
    e.inject("teresa-2", "disposal-check");
    run(e, 200, (en) => expect(en.state.units["teresa-2"].disposalValve).toBe("closed"));
    const u = e.state.units["teresa-2"];
    expect(u.faults).toContain("disposal-check");
    expect(u.condition).toBe("fault");
    expect(u.tankMl).toBeGreaterThan(0);
    e.resetFaults("teresa-2");
    expect(e.state.units["teresa-2"].stage).toBe("returning");
  });

  it("UV-C never runs with the lid interlock open", () => {
    const e = new WardEngine();
    e.inject("teresa-5", "uv-interlock");
    run(e, 30, (en) => expect(en.state.units["teresa-5"].uvOn).toBe(false));
    expect(e.state.units["teresa-5"].faults).toContain("uv-interlock");
    expect(e.state.units["teresa-5"].stage).toBe("uv-treatment");
    e.resetFaults("teresa-5");
    run(e, 1);
    expect(e.state.units["teresa-5"].uvOn).toBe(true);
  });

  it("emergency stop freezes motion and closes valves", () => {
    const e = new WardEngine();
    run(e, 8);
    e.setEstop("teresa-2", true);
    const p = { ...e.state.units["teresa-2"].pose };
    run(e, 10);
    const u = e.state.units["teresa-2"];
    expect(u.pose).toEqual(p);
    expect(u.disposalValve).toBe("closed");
    expect(u.condition).toBe("fault");
  });

  it("an obstacle stops the unit, then it resumes", () => {
    const e = new WardEngine();
    run(e, 8);
    expect(e.inject("teresa-2", "obstacle")).toBe(true);
    const p = { ...e.state.units["teresa-2"].pose };
    run(e, SIM.obstacleHoldS - 0.5);
    expect(e.state.units["teresa-2"].pose).toEqual(p);
    run(e, 3);
    expect(e.state.units["teresa-2"].obstacle).toBe(false);
    expect(e.state.units["teresa-2"].pose).not.toEqual(p);
  });
});

describe("determinism and selection independence", () => {
  it("same inputs give the same state", () => {
    const a = new WardEngine();
    const b = new WardEngine();
    run(a, 600);
    run(b, 600);
    expect(JSON.stringify(a.state)).toBe(JSON.stringify(b.state));
  });

  it("acting on one unit does not change another unit's state", () => {
    const a = new WardEngine();
    const b = new WardEngine();
    run(a, 5);
    run(b, 5);
    a.setEstop("teresa-3", true);
    run(a, 60);
    run(b, 60);
    // teresa-5 is docked and never competes for the disposal point in this window
    expect(JSON.stringify(a.state.units["teresa-5"])).toBe(JSON.stringify(b.state.units["teresa-5"]));
  });

  it("step back rewinds to the start of the stage", () => {
    const e = new WardEngine();
    run(e, 20);
    const u = e.state.units["teresa-2"];
    const stage = u.stage;
    const startT = u.stageStartT;
    expect(e.stepBack("teresa-2")).toBe(true);
    expect(e.state.units["teresa-2"].stage).toBe(stage);
    expect(e.state.t).toBeCloseTo(startT, 6);
  });

  it("step forward reaches the next stage", () => {
    const e = new WardEngine();
    const before = e.state.units["teresa-2"].stage;
    expect(e.stepForward("teresa-2")).toBe(true);
    expect(e.state.units["teresa-2"].stage).not.toBe(before);
  });
});
