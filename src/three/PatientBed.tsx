import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import type { Group } from "three";
import { BED } from "../teresa/model-config";

const FRAME = "#8aa4c8";
const LINEN = "#f7f7f4";
const BLANKET = "#3b82f6";

/**
 * Hospital bed with a patient for spatial context only.
 * Neutral, fully covered figure. No anatomy, no procedure animation —
 * only an optional, very subtle breathing movement of the blanket.
 */
export function PatientBed({ x, breathe = true, phase = 0 }: { x: number; breathe?: boolean; phase?: number }) {
  const torso = useRef<Group>(null);
  const L = BED.length;
  const W = BED.width;

  useFrame(({ clock }) => {
    if (!breathe || !torso.current) return;
    torso.current.scale.y = 1 + 0.035 * Math.sin(clock.elapsedTime * 1.5 + phase);
  });

  const legs: Array<[number, number]> = [
    [-W / 2 + 0.06, -L / 2 + 0.08],
    [W / 2 - 0.06, -L / 2 + 0.08],
    [-W / 2 + 0.06, L / 2 - 0.08],
    [W / 2 - 0.06, L / 2 - 0.08],
  ];

  return (
    <group position={[x, 0, BED.centerZ]}>
      {/* frame */}
      <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, 0.1, L]} />
        <meshStandardMaterial color={FRAME} roughness={0.5} metalness={0.3} />
      </mesh>
      {legs.map(([lx, lz], i) => (
        <group key={i} position={[lx, 0, lz]}>
          <mesh position={[0, 0.19, 0]} castShadow>
            <cylinderGeometry args={[0.022, 0.022, 0.34, 10]} />
            <meshStandardMaterial color={FRAME} roughness={0.4} metalness={0.5} />
          </mesh>
          <mesh position={[0, 0.035, 0]}>
            <sphereGeometry args={[0.035, 10, 8]} />
            <meshStandardMaterial color="#1e293b" roughness={0.7} />
          </mesh>
        </group>
      ))}
      {/* head and foot boards */}
      <mesh position={[0, 0.72, -L / 2 + 0.025]} castShadow>
        <boxGeometry args={[W, 0.56, 0.05]} />
        <meshStandardMaterial color={FRAME} roughness={0.5} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.6, L / 2 - 0.025]} castShadow>
        <boxGeometry args={[W, 0.34, 0.05]} />
        <meshStandardMaterial color={FRAME} roughness={0.5} metalness={0.2} />
      </mesh>
      {/* side rails (head half) */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (W / 2 + 0.01), 0.7, -0.35]} castShadow>
          <boxGeometry args={[0.02, 0.07, 0.9]} />
          <meshStandardMaterial color={FRAME} roughness={0.4} metalness={0.4} />
        </mesh>
      ))}
      {/* mattress */}
      <RoundedBox args={[W - 0.06, 0.16, L - 0.1]} radius={0.05} smoothness={3} position={[0, 0.51, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={LINEN} roughness={0.9} />
      </RoundedBox>
      {/* pillow + head */}
      <RoundedBox args={[0.58, 0.1, 0.34]} radius={0.045} smoothness={3} position={[0, 0.64, -L / 2 + 0.32]} castShadow>
        <meshStandardMaterial color="#ffffff" roughness={0.95} />
      </RoundedBox>
      <mesh position={[0, 0.75, -L / 2 + 0.34]} castShadow>
        <sphereGeometry args={[0.095, 20, 16]} />
        <meshStandardMaterial color="#e3b994" roughness={0.75} />
      </mesh>
      {/* blanket: lower layer and a soft torso contour */}
      <RoundedBox args={[W - 0.1, 0.12, 1.45]} radius={0.05} smoothness={3} position={[0, 0.64, 0.18]} castShadow receiveShadow>
        <meshStandardMaterial color={BLANKET} roughness={0.95} />
      </RoundedBox>
      <group ref={torso} position={[0, 0.69, -0.12]}>
        <RoundedBox args={[0.52, 0.09, 0.78]} radius={0.04} smoothness={3} position={[0, 0.03, 0]} castShadow>
          <meshStandardMaterial color={BLANKET} roughness={0.95} />
        </RoundedBox>
      </group>
    </group>
  );
}
