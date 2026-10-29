import { Suspense, lazy, useMemo } from "react";
import { Html, Line } from "@react-three/drei";
import { CatmullRomCurve3, Vector3 } from "three";
import { BED, DOCK, DRAIN, WARD, routePolyline, unitLayout } from "../teresa/model-config";
import { T } from "../teresa/text";
import { UNIT_IDS, type TeresaUnitId } from "../teresa/types";
import { BedsideDock } from "./BedsideDock";
import { PatientBed } from "./PatientBed";

const DrainDetail = __TERESA_FULL__ ? lazy(() => import("@private/DrainDetail")) : null;

const FLOOR = "#e6e3dd";
const WALL = "#f2f0eb";
const SKIRT = "#b8bec8";

function PatientLine({ index }: { index: number }) {
  const lay = unitLayout(index);
  const curve = useMemo(
    () =>
      new CatmullRomCurve3([
        new Vector3(lay.bedX + BED.width / 2 - 0.08, 0.63, BED.centerZ - 0.45),
        new Vector3(lay.bedX + BED.width / 2 + 0.05, 0.45, BED.centerZ - 0.62),
        new Vector3(lay.dockX - DOCK.width / 2 + 0.02, 0.5, DOCK.centerZ + 0.12),
      ]),
    [lay.bedX, lay.dockX],
  );
  return (
    <mesh>
      <tubeGeometry args={[curve, 24, 0.008, 8, false]} />
      <meshStandardMaterial color="#dfe8ee" roughness={0.3} transparent opacity={0.9} />
    </mesh>
  );
}

export function Ward({
  selected,
  breathe,
  showLabels,
}: {
  selected: TeresaUnitId;
  breathe: boolean;
  showLabels: boolean;
}) {
  const w = WARD.maxX - WARD.minX;
  const d = WARD.maxZ - WARD.minZ;
  const t = WARD.wallThickness;
  const selIndex = UNIT_IDS.indexOf(selected);
  const route = useMemo(() => routePolyline(selIndex).map((p) => [p.x, 0.012, p.z] as [number, number, number]), [selIndex]);

  return (
    <group>
      {/* floor (single-sided, so the bottom view can look up through it) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color={FLOOR} roughness={0.9} />
      </mesh>
      {/* aisle band */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, WARD.laneZ]} receiveShadow>
        <planeGeometry args={[w, 1.1]} />
        <meshStandardMaterial color="#e1ded7" roughness={0.9} />
      </mesh>
      {/* disposal corner patch */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[DRAIN.x, 0.0015, DRAIN.z]} receiveShadow>
        <planeGeometry args={[1.3, 1.3]} />
        <meshStandardMaterial color="#d8dbe0" roughness={0.85} />
      </mesh>

      {/* walls: back, left, right. The front is open for viewing. */}
      <mesh position={[0, WARD.wallHeight / 2, WARD.minZ - t / 2]} receiveShadow>
        <boxGeometry args={[w + 2 * t, WARD.wallHeight, t]} />
        <meshStandardMaterial color={WALL} roughness={0.95} />
      </mesh>
      {[WARD.minX - t / 2, WARD.maxX + t / 2].map((x) => (
        <mesh key={x} position={[x, WARD.wallHeight / 2, 0]} receiveShadow>
          <boxGeometry args={[t, WARD.wallHeight, d]} />
          <meshStandardMaterial color={WALL} roughness={0.95} />
        </mesh>
      ))}
      {/* skirting */}
      <mesh position={[0, 0.05, WARD.minZ + 0.005]}>
        <boxGeometry args={[w, 0.1, 0.01]} />
        <meshStandardMaterial color={SKIRT} roughness={0.7} />
      </mesh>
      {[WARD.minX + 0.005, WARD.maxX - 0.005].map((x) => (
        <mesh key={x} position={[x, 0.05, 0]}>
          <boxGeometry args={[0.01, 0.1, d]} />
          <meshStandardMaterial color={SKIRT} roughness={0.7} />
        </mesh>
      ))}
      {/* windows (left wall) and door (right wall) */}
      {[-2.2, 1.6].map((z) => (
        <mesh key={z} position={[WARD.minX + 0.004, 1.6, z]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[1.7, 1.15]} />
          <meshStandardMaterial color="#dfe9f4" emissive="#eaf2fb" emissiveIntensity={0.55} roughness={0.2} />
        </mesh>
      ))}
      <mesh position={[WARD.maxX - 0.004, 1.05, 2.6]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[1.0, 2.1]} />
        <meshStandardMaterial color="#d7d1c6" roughness={0.7} />
      </mesh>

      {/* beds, headwall panels, docks and patient lines */}
      {BED.xs.map((bx, i) => (
        <group key={bx}>
          <mesh position={[bx, 1.32, WARD.minZ + 0.03]}>
            <boxGeometry args={[1.0, 0.22, 0.05]} />
            <meshStandardMaterial color="#e3e7ed" roughness={0.6} />
          </mesh>
          <mesh position={[bx, 1.36, WARD.minZ + 0.058]}>
            <planeGeometry args={[0.8, 0.03]} />
            <meshStandardMaterial color="#f8fbff" emissive="#f4f8ff" emissiveIntensity={0.6} />
          </mesh>
          <PatientBed x={bx} breathe={breathe} phase={i * 1.3} />
          <BedsideDock unitId={UNIT_IDS[i]} x={unitLayout(i).dockX} />
          <PatientLine index={i} />
          {showLabels && (
            <Html position={[bx, 1.62, WARD.minZ + 0.08]} center zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
              <div className={`scene-label scene-label--muted${i === selIndex ? " is-selected" : ""}`}>Bed {i + 1}</div>
            </Html>
          )}
        </group>
      ))}

      {/* fixed disposal point (never moves) */}
      {DrainDetail ? (
        <Suspense fallback={null}>
          <DrainDetail />
        </Suspense>
      ) : (
        <mesh position={[DRAIN.x, 0.003, DRAIN.z]} receiveShadow>
          <boxGeometry args={[DRAIN.plateSize, 0.006, DRAIN.plateSize]} />
          <meshStandardMaterial color="#c3c9d0" metalness={0.6} roughness={0.35} />
        </mesh>
      )}
      {showLabels && (
        <Html position={[DRAIN.x, 0.05, DRAIN.z + 0.55]} center zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
          <div className="scene-label scene-label--accent">{T.disposalPointName} (fixed)</div>
        </Html>
      )}

      {/* route of the selected unit */}
      <Line points={route} color="#1f4e8c" lineWidth={1.6} dashed dashSize={0.18} gapSize={0.12} transparent opacity={0.75} />
    </group>
  );
}
