import { useEffect, useRef } from "react";
import { Outlines, RoundedBox } from "@react-three/drei";
import type { Group } from "three";
import { ROBOT, WHEEL_POSITIONS } from "../teresa/model-config";

export const ROBOT_WHITE = "#f4f5f2";

export interface RobotBodyProps {
  /** Thin navy outline for the selected unit. */
  highlighted?: boolean;
  /** Make the casing see-through (internal / drainage modes). */
  xray?: boolean;
  /** Cylinder segment count (lower on low-power devices). */
  segments?: number;
}

/**
 * TERESA mobile unit — exterior. Conceptual proportions, not to scale.
 *
 * Local frame: front = +Z, up = +Y, origin on the floor at the body centre.
 * Exactly FOUR wheels, all driven (one motor and encoder each), near the
 * corners, equal size, skid-steer. No casters, no fifth wheel.
 * Named children used by the animation: "wheel-spin-FL|FR|RL|RR", "status-light".
 */
export function RobotBody({ highlighted = false, xray = false, segments = 24 }: RobotBodyProps) {
  const root = useRef<Group>(null);
  const bodyY = ROBOT.groundClearance + ROBOT.bodyHeight / 2;

  useEffect(() => {
    if (!import.meta.env.DEV || !root.current) return;
    let wheels = 0;
    root.current.traverse((o) => {
      if (o.userData.isWheel) wheels++;
    });
    if (wheels !== 4) console.error(`[TERESA] Robot model must have exactly 4 wheels, found ${wheels}`);
  }, []);

  return (
    <group ref={root}>
      {/* casing */}
      <RoundedBox
        args={[ROBOT.bodyWidth, ROBOT.bodyHeight, ROBOT.bodyLength]}
        radius={ROBOT.cornerRadius}
        smoothness={4}
        position={[0, bodyY, 0]}
        castShadow={!xray}
        receiveShadow
      >
        <meshStandardMaterial
          color={ROBOT_WHITE}
          roughness={0.32}
          metalness={0.02}
          transparent={xray}
          opacity={xray ? 0.16 : 1}
          depthWrite={!xray}
        />
        {highlighted && <Outlines thickness={0.006} color="#0a84ff" />}
      </RoundedBox>

      {/* lower trim / bumper band */}
      <mesh position={[0, ROBOT.groundClearance + 0.018, ROBOT.bodyLength / 2 - 0.012]} castShadow>
        <boxGeometry args={[ROBOT.bodyWidth - 0.06, 0.03, 0.03]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.55} transparent={xray} opacity={xray ? 0.3 : 1} />
      </mesh>

      {/* status light strip (front top edge) */}
      <mesh name="status-light" position={[0, ROBOT.topY - 0.004, ROBOT.bodyLength / 2 - 0.07]}>
        <boxGeometry args={[0.16, 0.008, 0.016]} />
        <meshStandardMaterial color="#7cc0ff" emissive="#0a84ff" emissiveIntensity={1.2} toneMapped={false} />
      </mesh>

      {/* top transfer port (meets the dock coupling when docked) */}
      <mesh position={[0, ROBOT.topY + 0.002, -0.15]}>
        <cylinderGeometry args={[0.026, 0.026, 0.006, segments]} />
        <meshStandardMaterial color="#aeb5bf" metalness={0.6} roughness={0.35} />
      </mesh>

      {/* front LiDAR */}
      <group position={[0, ROBOT.topY, ROBOT.bodyLength / 2 - 0.13]}>
        <mesh position={[0, 0.008, 0]} castShadow>
          <cylinderGeometry args={[ROBOT.lidarRadius + 0.006, ROBOT.lidarRadius + 0.006, 0.016, segments]} />
          <meshStandardMaterial color="#2a303a" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.016 + ROBOT.lidarHeight / 2, 0]} castShadow>
          <cylinderGeometry args={[ROBOT.lidarRadius, ROBOT.lidarRadius, ROBOT.lidarHeight, segments]} />
          <meshStandardMaterial color="#1c2129" roughness={0.25} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.016 + ROBOT.lidarHeight / 2, 0]}>
          <cylinderGeometry args={[ROBOT.lidarRadius + 0.001, ROBOT.lidarRadius + 0.001, 0.008, segments, 1, true]} />
          <meshStandardMaterial color="#3d6fb0" emissive="#1f4e8c" emissiveIntensity={0.4} roughness={0.2} />
        </mesh>
      </group>

      {/* four driven wheels */}
      {WHEEL_POSITIONS.map((w) => (
        <group key={w.id} position={[w.x, ROBOT.wheelRadius, w.z]} userData={{ isWheel: true }}>
          <group name={`wheel-spin-${w.id}`}>
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[ROBOT.wheelRadius, ROBOT.wheelRadius, ROBOT.wheelWidth, segments]} />
              <meshStandardMaterial color="#23272e" roughness={0.85} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]} position={[Math.sign(w.x) * (ROBOT.wheelWidth / 2 + 0.001), 0, 0]}>
              <cylinderGeometry args={[ROBOT.wheelRadius * 0.55, ROBOT.wheelRadius * 0.55, 0.004, segments]} />
              <meshStandardMaterial color="#9aa1ab" metalness={0.5} roughness={0.35} />
            </mesh>
            {/* spoke mark so rotation is visible */}
            <mesh position={[Math.sign(w.x) * (ROBOT.wheelWidth / 2 + 0.003), ROBOT.wheelRadius * 0.3, 0]}>
              <boxGeometry args={[0.002, ROBOT.wheelRadius * 0.45, 0.01]} />
              <meshStandardMaterial color="#5c636e" />
            </mesh>
          </group>
        </group>
      ))}

      {/* wireless charging receiver plate (underside, rear) */}
      <mesh position={[0, ROBOT.groundClearance - 0.002, -0.12]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.16, 0.12]} />
        <meshStandardMaterial color="#5b6577" roughness={0.6} side={2} />
      </mesh>
    </group>
  );
}
