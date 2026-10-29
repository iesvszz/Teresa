import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { RobotBody } from "./RobotModel";
import { RoomEnv, SceneBoundary } from "./SceneSupport";
import { hasWebGL, isLowPower } from "./webgl";
import { usePrefersReducedMotion } from "../teresa/hooks";
import { HeroFallback } from "./HeroFallback";

function Turntable({ spin }: { spin: boolean }) {
  const g = useRef<Group>(null);
  useFrame((_, dt) => {
    if (spin && g.current) g.current.rotation.y += dt * 0.25;
  });
  return (
    <group ref={g} rotation={[0, -0.6, 0]}>
      <RobotBody segments={32} />
    </group>
  );
}

/** Landing-page hero: the TERESA mobile unit on a slow turntable, neutral studio light. */
export default function HeroRobot() {
  const [ok] = useState(() => hasWebGL());
  const [low] = useState(() => isLowPower());
  const reduced = usePrefersReducedMotion();
  if (!ok) return <HeroFallback />;
  return (
    <SceneBoundary fallback={<HeroFallback />}>
      <Canvas
        shadows
        dpr={low ? [1, 1.25] : [1, 2]}
        camera={{ position: [0.78, 0.42, 0.95], fov: 30, near: 0.01, far: 20 }}
        onCreated={({ camera }) => camera.lookAt(0, 0.12, 0)}
        gl={{ antialias: true, alpha: true }}
        aria-label="3D model of the TERESA mobile unit"
      >
        <RoomEnv intensity={0.7} />
        <hemisphereLight args={["#ffffff", "#e9e4dc", 0.5]} />
        <directionalLight position={[1.5, 2.5, 1.2]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0003}>
          <orthographicCamera attach="shadow-camera" args={[-0.6, 0.6, 0.6, -0.6, 0.1, 6]} />
        </directionalLight>
        <Turntable spin={!reduced} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[0.7, 64]} />
          <shadowMaterial opacity={0.18} />
        </mesh>
      </Canvas>
    </SceneBoundary>
  );
}
