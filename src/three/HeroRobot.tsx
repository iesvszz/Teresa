import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { MathUtils, type Group } from "three";
import { HeroUnit } from "./HeroUnit";
import { RoomEnv, SceneBoundary } from "./SceneSupport";
import { hasWebGL, isLowPower } from "./webgl";
import { usePrefersReducedMotion } from "../teresa/hooks";
import { HeroFallback } from "./HeroFallback";

const TARGET: [number, number, number] = [0, 0.21, 0];

/** Turns the unit toward the cursor wherever it is on the page, with a gentle hover. */
function CursorRig({ follow }: { follow: boolean }) {
  const g = useRef<Group>(null);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!follow) return;
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [follow]);

  useFrame(({ clock }, dt) => {
    const o = g.current;
    if (!o) return;
    const k = 1 - Math.exp(-dt * 4);
    o.rotation.y = MathUtils.lerp(o.rotation.y, -0.5 + pointer.current.x * 0.75, k);
    o.rotation.x = MathUtils.lerp(o.rotation.x, pointer.current.y * 0.12, k);
    if (follow) o.position.y = Math.sin(clock.elapsedTime * 1.2) * 0.004;
  });

  return (
    <group ref={g} rotation={[0, -0.5, 0]}>
      <HeroUnit />
    </group>
  );
}

/** Landing-page hero: the TERESA mobile unit. Follows the cursor; drag to turn it all the way round. */
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
        camera={{ position: [0.6, 0.55, 1.62], fov: 30, near: 0.01, far: 20 }}
        gl={{ antialias: true, alpha: true }}
        style={{ cursor: "grab" }}
        aria-label="3D model of the TERESA mobile unit. Drag to rotate."
      >
        <RoomEnv intensity={0.75} />
        <hemisphereLight args={["#ffffff", "#e4ecf7", 0.55]} />
        <directionalLight position={[1.4, 2.6, 1.6]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0003}>
          <orthographicCamera attach="shadow-camera" args={[-0.7, 0.7, 0.7, -0.7, 0.1, 6]} />
        </directionalLight>
        <directionalLight position={[-1.5, 1, -1]} intensity={0.35} color="#cfe3ff" />
        <CursorRig follow={!reduced} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[0.9, 64]} />
          <shadowMaterial opacity={0.16} />
        </mesh>
        <OrbitControls
          target={TARGET}
          enablePan={false}
          enableZoom={false}
          enableDamping
          rotateSpeed={0.7}
          minPolarAngle={Math.PI * 0.25}
          maxPolarAngle={Math.PI * 0.47}
        />
      </Canvas>
    </SceneBoundary>
  );
}
