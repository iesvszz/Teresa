import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import { simStore } from "../teresa/store";
import type { Pose, TeresaUnitId } from "../teresa/types";
import type { ViewMode } from "./types";

/** Minimal shape of drei's OrbitControls (makeDefault). */
interface Controls {
  target: Vector3;
  enabled: boolean;
  minPolarAngle: number;
  maxPolarAngle: number;
  update: () => void;
}

const FOLLOW: ReadonlySet<ViewMode> = new Set<ViewMode>(["side", "closeup", "bottom"]);

function preset(view: ViewMode, pose: Pose, sideHeading: number): { pos: Vector3; target: Vector3 } {
  const r = new Vector3(pose.x, 0.14, pose.z);
  switch (view) {
    case "overview":
      return { pos: new Vector3(1.2, 8.2, 8.6), target: new Vector3(0.4, 0, -1.7) };
    case "top":
      return { pos: new Vector3(0.3, 15.5, -0.59), target: new Vector3(0.3, 0, -0.6) };
    case "side": {
      // perpendicular to the unit's heading at the moment the view was chosen
      const sx = Math.cos(sideHeading);
      const sz = -Math.sin(sideHeading);
      return { pos: new Vector3(r.x + sx * 1.6, 0.42, r.z + sz * 1.6), target: r };
    }
    case "closeup":
      return { pos: new Vector3(r.x + 0.75, 0.62, r.z + 0.95), target: r };
    case "bottom":
      // below floor level, looking up at the underside (the floor is single-sided)
      return { pos: new Vector3(r.x + 0.45, -0.55, r.z + 0.55), target: new Vector3(r.x, 0.05, r.z) };
  }
}

const ease = (k: number) => 1 - Math.pow(1 - k, 3);

/** Smooth camera transitions between presets; follows the selected unit in follow views. */
export function CameraRig({ unitId, view, instant }: { unitId: TeresaUnitId; view: ViewMode; instant: boolean }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as Controls | null;
  const anim = useRef<{ fromP: Vector3; fromT: Vector3; start: number; dur: number; sideHeading: number } | null>(null);
  const last = useRef<Vector3 | null>(null);
  const tmp = useRef(new Vector3());

  useEffect(() => {
    if (!controls) return;
    const u = simStore.live.units[unitId];
    anim.current = {
      fromP: camera.position.clone(),
      fromT: controls.target.clone(),
      start: performance.now(),
      dur: instant ? 0 : 900,
      sideHeading: u.pose.heading,
    };
    last.current = null;
    controls.maxPolarAngle = view === "bottom" ? Math.PI : Math.PI / 2 - 0.02;
    controls.minPolarAngle = view === "bottom" ? Math.PI / 2 + 0.05 : 0;
  }, [view, unitId, controls, camera, instant]);

  useFrame(() => {
    if (!controls) return;
    const u = simStore.live.units[unitId];
    const robot = tmp.current.set(u.pose.x, 0.14, u.pose.z);
    const a = anim.current;
    if (a) {
      const p = preset(view, u.pose, a.sideHeading);
      const k = a.dur === 0 ? 1 : ease(Math.min(1, (performance.now() - a.start) / a.dur));
      camera.position.lerpVectors(a.fromP, p.pos, k);
      controls.target.lerpVectors(a.fromT, p.target, k);
      controls.enabled = k >= 1;
      if (k >= 1) {
        anim.current = null;
        last.current = robot.clone();
      }
      return;
    }
    if (FOLLOW.has(view)) {
      if (last.current) {
        const dx = robot.x - last.current.x;
        const dz = robot.z - last.current.z;
        if (dx !== 0 || dz !== 0) {
          camera.position.x += dx;
          camera.position.z += dz;
          controls.target.x += dx;
          controls.target.z += dz;
        }
        last.current.copy(robot);
      } else {
        last.current = robot.clone();
      }
    }
  });

  return null;
}
