import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { WORDMARK_PATHS } from "../components/wordmarkPaths";
import { CanvasTexture, ExtrudeGeometry, type MeshStandardMaterial, Shape, SRGBColorSpace } from "three";

/**
 * TERESA mobile unit as presented on the landing page: white rounded body,
 * glowing blue belt line, front camera bar, two large drive wheels with lit
 * hubs at the rear and two swivel casters at the front.
 *
 * Presentation model only. The ward simulation uses RobotBody (RobotModel.tsx),
 * whose geometry the docking and motion code depend on.
 *
 * Local frame: front = +Z, up = +Y, origin on the floor at the body centre.
 */

const W = 0.36; // width (x)
const L = 0.44; // length (z)
const PLAN_R = 0.085; // corner radius seen from above

const BODY_Y0 = 0.07;
const BODY_H = 0.29;
const LID_Y0 = BODY_Y0 + BODY_H + 0.004;
const LID_H = 0.075;
const TOP_Y = LID_Y0 + LID_H;
const BAND_Y = 0.235;

const WHITE = "#f7f8fa";
const LID_WHITE = "#fbfcfd";
const INK = "#0a0f1a"; // site --text, as on the landing-page wordmark
const WORDMARK_PX = [1312, 224] as const; // 640 × 100 at 2×, plus margins
const GLOW = "#1f6bff"; // belt line and hub rings; kept below 1.0 per channel so it reads blue, not cyan
const TYRE = "#16181c";

const WHEEL_R = 0.1;
const WHEEL_W = 0.055;
const WHEEL_X = W / 2 + WHEEL_W / 2 - 0.012;
const WHEEL_Z = -L / 2 + 0.13;

const CASTER_R = 0.034;
const CASTER_X = W / 2 - 0.075;
const CASTER_Z = L / 2 - 0.09;

function roundedRect(w: number, l: number, r: number) {
  const s = new Shape();
  const x = -w / 2;
  const y = -l / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + l - r);
  s.quadraticCurveTo(x + w, y + l, x + w - r, y + l);
  s.lineTo(x + r, y + l);
  s.quadraticCurveTo(x, y + l, x, y + l - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** A rounded slab w × h × l whose bottom sits at y = 0; `bevel` rounds the top and bottom edges. */
function slab(w: number, h: number, l: number, r: number, bevel: number, segments = 6) {
  const g = new ExtrudeGeometry(roundedRect(w - 2 * bevel, l - 2 * bevel, Math.max(0.001, r - bevel)), {
    depth: Math.max(0.0001, h - 2 * bevel),
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: segments,
    curveSegments: 24,
  });
  g.rotateX(-Math.PI / 2);
  g.translate(0, bevel, 0);
  g.computeVertexNormals();
  return g;
}

/** The site wordmark (same strokes as TeresaWordmark), drawn to a texture for the front panel. */
function useWordmark() {
  const tex = useMemo(() => {
    // Same 640 × 100 artwork as the site wordmark, drawn at 2× with a small margin.
    const c = document.createElement("canvas");
    c.width = WORDMARK_PX[0];
    c.height = WORDMARK_PX[1];
    const ctx = c.getContext("2d");
    if (ctx) {
      ctx.translate(16, 12);
      ctx.scale(2, 2);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 7;
      ctx.lineCap = "butt";
      ctx.lineJoin = "miter";
      WORDMARK_PATHS.forEach((d) => ctx.stroke(new Path2D(d)));
    }
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

function DriveWheel({ side }: { side: 1 | -1 }) {
  const ring = useRef<MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (ring.current) ring.current.emissiveIntensity = 1.1 + Math.sin(clock.elapsedTime * 2) * 0.2;
  });
  const face = side * (WHEEL_W / 2);
  return (
    <group position={[side * WHEEL_X, WHEEL_R, WHEEL_Z]}>
      {/* tyre */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[WHEEL_R, WHEEL_R, WHEEL_W, 48]} />
        <meshStandardMaterial color={TYRE} roughness={0.9} />
      </mesh>
      {/* rounded tyre shoulders */}
      {[1, -1].map((s) => (
        <mesh key={s} position={[s * (WHEEL_W / 2 - 0.004), 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[WHEEL_R - 0.008, 0.009, 12, 48]} />
          <meshStandardMaterial color={TYRE} roughness={0.85} />
        </mesh>
      ))}
      {/* hub */}
      <mesh position={[face + side * 0.002, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[WHEEL_R * 0.62, WHEEL_R * 0.62, 0.006, 48]} />
        <meshStandardMaterial color="#1b1e24" roughness={0.45} metalness={0.2} />
      </mesh>
      {/* lit ring */}
      <mesh position={[face + side * 0.005, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[WHEEL_R * 0.66, 0.0045, 12, 64]} />
        <meshStandardMaterial ref={ring} color="#0a6fe0" emissive={GLOW} emissiveIntensity={1.1} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Caster({ x }: { x: number }) {
  return (
    <group position={[x, 0, CASTER_Z]}>
      {/* swivel stem and plate */}
      <mesh position={[0, BODY_Y0 - 0.006, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.012, 24]} />
        <meshStandardMaterial color="#202329" roughness={0.5} />
      </mesh>
      {/* fork */}
      {[1, -1].map((s) => (
        <mesh key={s} position={[s * 0.016, CASTER_R + 0.012, -0.008]} castShadow>
          <boxGeometry args={[0.006, 0.05, 0.03]} />
          <meshStandardMaterial color="#202329" roughness={0.45} metalness={0.2} />
        </mesh>
      ))}
      {/* wheel */}
      <mesh position={[0, CASTER_R, -0.014]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[CASTER_R, CASTER_R, 0.024, 32]} />
        <meshStandardMaterial color={TYRE} roughness={0.8} />
      </mesh>
      <mesh position={[0.0125, CASTER_R, -0.014]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.007, 0.007, 0.003, 16]} />
        <meshStandardMaterial color="#9aa3ad" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

export function HeroUnit() {
  const body = useMemo(() => slab(W, BODY_H, L, PLAN_R, 0.03, 8), []);
  const lid = useMemo(() => slab(W + 0.008, LID_H, L + 0.008, PLAN_R + 0.004, 0.016, 6), []);
  const band = useMemo(() => slab(W + 0.006, 0.014, L + 0.006, PLAN_R + 0.003, 0, 1), []);
  const pad = useMemo(() => slab(0.13, 0.008, 0.13, 0.024, 0.003, 3), []);
  const handle = useMemo(() => slab(0.026, 0.006, 0.07, 0.012, 0, 1), []);
  const camBar = useMemo(() => slab(0.084, 0.008, 0.026, 0.012, 0.002, 2), []);
  const wordmark = useWordmark();

  const bandMat = useRef<MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (bandMat.current) bandMat.current.emissiveIntensity = 1.15 + Math.sin(clock.elapsedTime * 1.6) * 0.2;
  });

  useEffect(() => () => [body, lid, band, pad, handle, camBar].forEach((g) => g.dispose()), [body, lid, band, pad, handle, camBar]);

  const front = L / 2;

  return (
    <group>
      {/* lower body */}
      <mesh geometry={body} position={[0, BODY_Y0, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={WHITE} roughness={0.28} metalness={0.02} />
      </mesh>

      {/* lid with a fine shadow gap below it */}
      <mesh geometry={lid} position={[0, LID_Y0, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={LID_WHITE} roughness={0.22} metalness={0.02} />
      </mesh>

      {/* top access pad with its slot */}
      <mesh geometry={pad} position={[0, TOP_Y - 0.004, -0.005]}>
        <meshStandardMaterial color="#e4e7eb" roughness={0.35} />
      </mesh>
      <mesh position={[0, TOP_Y + 0.0045, -0.005]}>
        <boxGeometry args={[0.032, 0.002, 0.004]} />
        <meshStandardMaterial color="#5f6670" />
      </mesh>

      {/* glowing belt line */}
      <mesh geometry={band} position={[0, BAND_Y - 0.007, 0]}>
        <meshStandardMaterial ref={bandMat} color="#0a6fe0" emissive={GLOW} emissiveIntensity={1.15} toneMapped={false} />
      </mesh>

      {/* front camera bar: three lenses, two status pips */}
      <group position={[0, BAND_Y + 0.05, front]}>
        <mesh geometry={camBar} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.004]}>
          <meshStandardMaterial color="#0d0f13" roughness={0.2} metalness={0.3} />
        </mesh>
        {[-0.022, 0, 0.022].map((x) => (
          <mesh key={x} position={[x, 0, 0.0055]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.0055, 0.0055, 0.002, 20]} />
            <meshStandardMaterial color="#1f2a3d" roughness={0.05} metalness={0.6} emissive="#0b2a55" emissiveIntensity={0.6} />
          </mesh>
        ))}
        {[-0.07, 0.07].map((x) => (
          <mesh key={x} position={[x, 0, 0.001]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.003, 0.003, 0.002, 12]} />
            <meshStandardMaterial color="#2a2f37" />
          </mesh>
        ))}
      </group>

      {/* wordmark */}
      <mesh position={[0, BAND_Y - 0.06, front + 0.0012]}>
        <planeGeometry args={[0.2, (0.2 * WORDMARK_PX[1]) / WORDMARK_PX[0]]} />
        <meshStandardMaterial map={wordmark} transparent roughness={0.4} depthWrite={false} />
      </mesh>

      {/* side grip recesses */}
      {[1, -1].map((s) => (
        <mesh key={s} geometry={handle} position={[s * (W / 2 + 0.004), LID_Y0 - 0.045, 0.1]} rotation={[0, 0, (s * Math.PI) / 2]}>
          <meshStandardMaterial color="#14171c" roughness={0.4} />
        </mesh>
      ))}

      <DriveWheel side={1} />
      <DriveWheel side={-1} />
      <Caster x={CASTER_X} />
      <Caster x={-CASTER_X} />
    </group>
  );
}
