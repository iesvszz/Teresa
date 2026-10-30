import { Suspense, lazy, useMemo, useRef } from "react";
import { type ThreeEvent, useFrame } from "@react-three/fiber";
import { Color, type Group, type Mesh, type MeshStandardMaterial, type Object3D } from "three";
import { ROBOT, WHEEL_POSITIONS } from "../teresa/model-config";
import { normalizeAngle } from "../teresa/motion";
import { simStore } from "../teresa/store";
import type { TeresaUnitId } from "../teresa/types";
import { RobotBody } from "./RobotModel";
import type { ModelMode } from "./types";
import { SceneLabel } from "./SceneLabel";

/** Full-disclosure internals. Removed from the public bundle at build time. */
const RobotFullDetail = __TERESA_FULL__ ? lazy(() => import("@private/RobotFullDetail")) : null;

const C_ACTIVE = new Color("#0a84ff");
const C_DOCKED = new Color("#22c55e");
const C_WARN = new Color("#f59e0b");
const C_FAULT = new Color("#ef4444");

interface Props {
  unitId: TeresaUnitId;
  label: string;
  selected: boolean;
  modelMode: ModelMode;
  segments: number;
  showLabel: boolean;
  onSelect: (id: TeresaUnitId) => void;
}

/** A mobile unit driven by the shared simulation state (read per frame, no React updates). */
export function SimRobot({ unitId, label, selected, modelMode, segments, showLabel, onSelect }: Props) {
  const group = useRef<Group>(null);
  const obstacle = useRef<Mesh>(null);
  const prev = useRef<{ x: number; z: number; h: number } | null>(null);
  const parts = useRef<{ wheels: Array<{ obj: Object3D; x: number }>; light: MeshStandardMaterial | null } | null>(null);

  const xray = selected && modelMode !== "assembled";

  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    const u = simStore.live.units[unitId];
    g.position.set(u.pose.x, 0, u.pose.z);
    g.rotation.y = u.pose.heading;

    if (!parts.current) {
      const wheels = WHEEL_POSITIONS.map((w) => ({ obj: g.getObjectByName(`wheel-spin-${w.id}`)!, x: w.x })).filter((w) => w.obj);
      const lightMesh = g.getObjectByName("status-light") as Mesh | undefined;
      parts.current = { wheels, light: (lightMesh?.material as MeshStandardMaterial) ?? null };
    }

    // Wheel spin from the pose change (skid-steer: v_wheel = v - ω·x).
    const p = prev.current;
    if (p) {
      const dx = u.pose.x - p.x;
      const dz = u.pose.z - p.z;
      const fwd = dx * Math.sin(u.pose.heading) + dz * Math.cos(u.pose.heading);
      const dh = normalizeAngle(u.pose.heading - p.h);
      for (const w of parts.current.wheels) w.obj.rotation.x += (fwd - dh * w.x) / ROBOT.wheelRadius;
    }
    prev.current = { x: u.pose.x, z: u.pose.z, h: u.pose.heading };

    // Status light.
    const light = parts.current.light;
    if (light) {
      const c = u.condition === "fault" ? C_FAULT : u.condition === "warning" ? C_WARN : u.docked ? C_DOCKED : C_ACTIVE;
      light.emissive.copy(c);
      const blink = u.condition !== "normal" ? 0.5 + 0.5 * Math.sin(clock.elapsedTime * 6) : 1;
      light.emissiveIntensity = 0.9 * blink;
    }

    if (obstacle.current) obstacle.current.visible = u.obstacle;
  });

  const onClick = useMemo(
    () => (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      onSelect(unitId);
    },
    [onSelect, unitId],
  );

  return (
    <group
      ref={group}
      onClick={onClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "";
      }}
    >
      <RobotBody highlighted={selected} xray={xray} segments={segments} />
      {RobotFullDetail && (
        <Suspense fallback={null}>
          <RobotFullDetail unitId={unitId} modelMode={selected ? modelMode : "assembled"} showLabels={selected && showLabel} />
        </Suspense>
      )}
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
          <ringGeometry args={[0.36, 0.385, 48]} />
          <meshBasicMaterial color="#0a84ff" transparent opacity={0.9} />
        </mesh>
      )}
      {/* obstacle marker ahead of the unit (demo fault) */}
      <mesh ref={obstacle} position={[0, 0.12, 0.62]} visible={false} castShadow>
        <coneGeometry args={[0.09, 0.24, 16]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.6} />
      </mesh>
      {showLabel && (
        <SceneLabel position={[0, 0.48, 0]} className={`scene-label${selected ? " is-selected" : ""}`} text={label} zIndex={selected ? 30 : 20} />
      )}
    </group>
  );
}
