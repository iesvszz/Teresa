import { BED, DOCK, DRAIN, WARD, routePolyline, unitLayout } from "../teresa/model-config";
import { T } from "../teresa/text";
import { UNIT_IDS, type TeresaUnitId } from "../teresa/types";

/**
 * Static plan view of the ward, used when WebGL is unavailable.
 * Same geometry as the 3D scene (model-config.ts).
 */
export function SceneFallback({ selected, reason }: { selected?: TeresaUnitId; reason?: string }) {
  const pad = 0.4;
  const vb = `${WARD.minX - pad} ${WARD.minZ - pad} ${WARD.maxX - WARD.minX + 2 * pad} ${WARD.maxZ - WARD.minZ + 2 * pad}`;
  const sel = selected ? UNIT_IDS.indexOf(selected) : -1;
  const route = sel >= 0 ? routePolyline(sel) : [];
  return (
    <div className="scene-fallback" role="img" aria-label="Plan view of the simulated ward: five beds along the back wall, a dock beside each bed, and a fixed disposal point in the back-right corner.">
      <svg viewBox={vb} preserveAspectRatio="xMidYMid meet">
        <rect x={WARD.minX} y={WARD.minZ} width={WARD.maxX - WARD.minX} height={WARD.maxZ - WARD.minZ} fill="#f3f5f8" stroke="#b8bec8" strokeWidth={0.04} />
        <rect x={WARD.minX} y={WARD.laneZ - 0.55} width={WARD.maxX - WARD.minX} height={1.1} fill="#e4e7ec" />
        {BED.xs.map((bx, i) => {
          const lay = unitLayout(i);
          return (
            <g key={bx}>
              <rect x={bx - BED.width / 2} y={BED.centerZ - BED.length / 2} width={BED.width} height={BED.length} rx={0.06} fill="#fff" stroke="#c4cad3" strokeWidth={0.03} />
              <rect x={lay.dockX - DOCK.width / 2} y={DOCK.centerZ - DOCK.depth / 2} width={DOCK.width} height={DOCK.depth} fill={i === sel ? "#1f4e8c" : "#c9d0da"} />
              <text x={bx} y={BED.centerZ + 0.2} fontSize={0.32} textAnchor="middle" fill="#5b6577">
                {i + 1}
              </text>
            </g>
          );
        })}
        {route.length > 0 && (
          <polyline points={route.map((p) => `${p.x},${p.z}`).join(" ")} fill="none" stroke="#1f4e8c" strokeWidth={0.05} strokeDasharray="0.18 0.12" />
        )}
        <rect x={DRAIN.x - 0.2} y={DRAIN.z - 0.2} width={0.4} height={0.4} fill="#c3c9d0" stroke="#5b6577" strokeWidth={0.03} />
        <text x={DRAIN.x} y={DRAIN.z + 0.75} fontSize={0.28} textAnchor="middle" fill="#1f4e8c">
          {T.disposalPointName}
        </text>
      </svg>
      <p className="small muted">{reason ?? "3D view unavailable on this device — showing a static plan."}</p>
    </div>
  );
}
