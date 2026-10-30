import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh, MeshStandardMaterial } from "three";
import { DOCK, ROBOT } from "../teresa/model-config";
import { simStore } from "../teresa/store";
import type { TeresaUnitId } from "../teresa/types";

const HOUSING = "#ffffff";
const PANEL = "#dbe8fb";
const TOP = "#1e3a8a";
const FLUID = "#0a84ff";

/**
 * Fixed bedside outer dock (doubles as the bedside table).
 * Lower bay: three-sided casing with an open front where the mobile unit parks
 * over the wireless charging pad. Upper housing: buffer with a level window.
 * The dock NEVER moves; only the mobile unit leaves.
 */
export function BedsideDock({ unitId, x }: { unitId: TeresaUnitId; x: number }) {
  const gauge = useRef<Mesh>(null);
  const pad = useRef<MeshStandardMaterial>(null);
  const flow = useRef<Mesh>(null);
  const couplingMat = useRef<MeshStandardMaterial>(null);

  const W = DOCK.width;
  const D = DOCK.depth;
  const bayH = DOCK.bayHeight;
  const housingH = DOCK.height - bayH - 0.04;
  const gaugeH = 0.26;

  useFrame(() => {
    const u = simStore.live.units[unitId];
    if (gauge.current) {
      const f = Math.max(0.001, u.bufferMl / DOCK.bufferCapacityMl);
      gauge.current.scale.y = f;
      gauge.current.position.y = bayH + 0.08 + (gaugeH * f) / 2;
    }
    if (pad.current) pad.current.emissiveIntensity = u.charging ? 0.6 : 0;
    const transferring = u.transferValve === "open";
    if (flow.current) flow.current.visible = transferring;
    if (couplingMat.current) couplingMat.current.emissiveIntensity = transferring ? 0.9 : 0;
  });

  return (
    <group position={[x, 0, DOCK.centerZ]}>
      {/* bay floor + wireless charging pad */}
      <mesh position={[0, 0.004, 0]} receiveShadow>
        <boxGeometry args={[W - 0.02, 0.008, D - 0.02]} />
        <meshStandardMaterial color="#d9dce1" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.011, 0]}>
        <boxGeometry args={[0.2, 0.004, 0.2]} />
        <meshStandardMaterial ref={pad} color="#2b3a52" emissive="#2f6fd0" emissiveIntensity={0} roughness={0.6} />
      </mesh>
      {/* three-sided bay casing, open front (+Z) */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (W / 2 - DOCK.panel / 2), bayH / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[DOCK.panel, bayH, D]} />
          <meshStandardMaterial color={PANEL} roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, bayH / 2, -D / 2 + DOCK.panel / 2]} castShadow receiveShadow>
        <boxGeometry args={[W, bayH, DOCK.panel]} />
        <meshStandardMaterial color={PANEL} roughness={0.6} />
      </mesh>
      {/* upper housing (buffer) */}
      <mesh position={[0, bayH + housingH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, housingH, D]} />
        <meshStandardMaterial color={HOUSING} roughness={0.55} />
      </mesh>
      {/* table top */}
      <mesh position={[0, DOCK.height - 0.02, 0]} castShadow receiveShadow>
        <boxGeometry args={[W + 0.06, 0.03, D + 0.04]} />
        <meshStandardMaterial color={TOP} roughness={0.7} />
      </mesh>
      {/* status display */}
      <mesh position={[-0.08, bayH + housingH - 0.1, D / 2 + 0.001]}>
        <planeGeometry args={[0.18, 0.07]} />
        <meshStandardMaterial color="#1b2638" emissive="#24456f" emissiveIntensity={0.5} roughness={0.3} />
      </mesh>
      {/* buffer level window */}
      <mesh position={[0.15, bayH + 0.08 + gaugeH / 2, D / 2 + 0.001]}>
        <planeGeometry args={[0.06, gaugeH + 0.02]} />
        <meshStandardMaterial color="#2a3446" roughness={0.4} />
      </mesh>
      <mesh ref={gauge} position={[0.15, bayH + 0.08, D / 2 + 0.003]}>
        <planeGeometry args={[0.044, gaugeH]} />
        <meshBasicMaterial color={FLUID} toneMapped={false} />
      </mesh>
      {/* transfer coupling above the parked unit's top port */}
      <mesh position={[0, bayH - 0.012, -0.15]}>
        <cylinderGeometry args={[0.022, 0.022, 0.024, 16]} />
        <meshStandardMaterial ref={couplingMat} color="#9aa3af" emissive={FLUID} emissiveIntensity={0} metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh ref={flow} position={[0, (bayH - 0.024 + ROBOT.topY) / 2, -0.15]} visible={false}>
        <cylinderGeometry args={[0.008, 0.008, bayH - 0.024 - ROBOT.topY + 0.01, 10]} />
        <meshBasicMaterial color={FLUID} toneMapped={false} />
      </mesh>
    </group>
  );
}
