import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { UNIT_IDS, type TeresaUnitId } from "../teresa/types";
import { UNIT_META } from "../teresa/model-config";
import { usePrefersReducedMotion } from "../teresa/hooks";
import { CameraRig } from "./CameraRig";
import { SimRobot } from "./SimRobot";
import { Ward } from "./Ward";
import { ContextLossWatcher, RoomEnv, SceneBoundary } from "./SceneSupport";
import { SceneFallback } from "./SceneFallback";
import { hasWebGL, isLowPower } from "./webgl";
import { LabelLayerContext } from "./labelLayer";
import type { ModelMode, ViewMode } from "./types";

export interface WardSceneProps {
  /** The selected unit — highlighted, focused and labelled. Comes from the URL via the dashboard. */
  unitId: TeresaUnitId;
  view: ViewMode;
  modelMode: ModelMode;
  onSelectUnit: (id: TeresaUnitId) => void;
  height?: number | string;
  showLabels?: boolean;
  /** False pauses rendering (e.g. while an expanded copy of the scene is open). */
  active?: boolean;
}

/**
 * Interactive 3D hospital ward (React Three Fiber).
 *
 * The scene only READS the shared simulation state (simStore.live) inside
 * useFrame; it never owns workflow logic. React props change only when the
 * selection, view or model mode change.
 */
export default function WardScene({ unitId, view, modelMode, onSelectUnit, height = 560, showLabels = true, active = true }: WardSceneProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [lost, setLost] = useState(false);
  const [supported] = useState(() => hasWebGL());
  const [lowPower] = useState(() => isLowPower());
  const reduced = usePrefersReducedMotion();
  const onLost = useCallback(() => setLost(true), []);
  const [labelLayer, setLabelLayer] = useState<HTMLDivElement | null>(null);

  // Render only while on screen.
  useEffect(() => {
    const el = wrap.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "120px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const fallback = <SceneFallback selected={unitId} />;
  if (!supported || lost) {
    return (
      <div className="scene-wrap" style={{ height }}>
        <SceneFallback selected={unitId} reason={lost ? "The 3D view lost its graphics context — showing a static plan." : undefined} />
      </div>
    );
  }

  const segments = lowPower ? 14 : 24;

  return (
    <div ref={wrap} className="scene-wrap" style={{ height }}>
      <SceneBoundary fallback={fallback}>
        <LabelLayerContext.Provider value={labelLayer}>
        <Canvas
          shadows
          dpr={lowPower ? [1, 1.25] : [1, 2]}
          frameloop={visible && active ? "always" : "never"}
          camera={{ position: [1.2, 8.2, 8.6], fov: 38, near: 0.05, far: 80 }}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          onPointerMissed={() => {
            document.body.style.cursor = "";
          }}
          aria-label="3D ward simulation"
        >
          <color attach="background" args={["#eef4fd"]} />
          <fog attach="fog" args={["#eef4fd", 18, 40]} />
          <RoomEnv intensity={0.45} />
          <ContextLossWatcher onLost={onLost} />
          <hemisphereLight args={["#ffffff", "#b9cff0", 0.6]} />
          <directionalLight
            position={[5, 10, 6]}
            intensity={1.35}
            castShadow
            shadow-mapSize={lowPower ? [1024, 1024] : [2048, 2048]}
            shadow-camera-left={-9}
            shadow-camera-right={9}
            shadow-camera-top={7}
            shadow-camera-bottom={-7}
            shadow-camera-near={1}
            shadow-camera-far={30}
            shadow-bias={-0.0004}
            shadow-normalBias={0.02}
          />
          <Ward selected={unitId} breathe={!reduced} showLabels={showLabels} />
          {UNIT_IDS.map((id) => (
            <SimRobot
              key={id}
              unitId={id}
              label={UNIT_META[id].label}
              selected={id === unitId}
              modelMode={modelMode}
              segments={segments}
              showLabel={showLabels}
              onSelect={onSelectUnit}
            />
          ))}
          <OrbitControls makeDefault enableDamping dampingFactor={0.06} rotateSpeed={0.7} zoomSpeed={0.8} minDistance={0.35} maxDistance={24} target={[0.4, 0, -1.7]} />
          <CameraRig unitId={unitId} view={view} instant={reduced} />
        </Canvas>
        </LabelLayerContext.Provider>
      </SceneBoundary>
      <div ref={setLabelLayer} className="scene-labels" aria-hidden="true" />
    </div>
  );
}
