/** Custom technical diagrams for the public pages. Labels follow the disclosure mode. */
import { T } from "../teresa/text";

const NAVY = "#0f1b2d";
const ACCENT = "#1f4e8c";
const FLUID = "#d98e04";
const MUTED = "#5b6577";
const LINE = "#c4cad3";

function Box({ x, y, w, h, title, sub, accent = false }: { x: number; y: number; w: number; h: number; title: string; sub?: string; accent?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={10} fill={accent ? "#e8eef7" : "#fff"} stroke={accent ? ACCENT : LINE} strokeWidth={1.5} />
      <text x={x + w / 2} y={y + (sub ? h / 2 - 4 : h / 2 + 5)} textAnchor="middle" fontSize={15} fontWeight={600} fill={NAVY}>
        {title}
      </text>
      {sub && (
        <text x={x + w / 2} y={y + h / 2 + 16} textAnchor="middle" fontSize={12} fill={MUTED}>
          {sub}
        </text>
      )}
    </g>
  );
}

function Arrow({ x1, y1, x2, y2, label, color = FLUID }: { x1: number; y1: number; x2: number; y2: number; label?: string; color?: string }) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={2.5} markerEnd={`url(#arrow-${color.slice(1)})`} />
      {label && (
        <text x={mx} y={my - 9} textAnchor="middle" fontSize={11.5} fill={MUTED}>
          {label}
        </text>
      )}
    </g>
  );
}

function Defs() {
  return (
    <defs>
      {[FLUID, ACCENT, MUTED].map((c) => (
        <marker key={c} id={`arrow-${c.slice(1)}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill={c} />
        </marker>
      ))}
    </defs>
  );
}

/** Patient → bedside part → mobile unit → disposal point. */
export function SystemDiagram() {
  return (
    <figure className="diagram">
      <svg viewBox="0 0 900 250" role="img" aria-labelledby="sysdiag-t">
        <title id="sysdiag-t">TERESA system: the patient line connects to the fixed bedside part; collected urine transfers to the mobile unit, which travels to the disposal point and returns.</title>
        <Defs />
        <Box x={10} y={80} w={150} h={70} title="Patient line" sub="catheter tube" />
        <Box x={230} y={60} w={200} h={110} title={T.ui.diagram.dockTitle} sub={T.ui.diagram.dockSub} accent />
        <Box x={500} y={60} w={190} h={110} title="Mobile unit" sub={T.ui.diagram.unitSub} accent />
        <Box x={760} y={80} w={130} h={70} title={T.ui.diagram.endTitle} sub="fixed" />
        <Arrow x1={160} y1={115} x2={226} y2={115} label="urine" />
        <Arrow x1={430} y1={115} x2={496} y2={115} label="transfer" />
        <Arrow x1={690} y1={115} x2={756} y2={115} label={T.ui.diagram.endArrow} />
        <path d="M 595 175 C 595 230, 330 230, 330 175" fill="none" stroke={ACCENT} strokeWidth={2} strokeDasharray="6 5" markerEnd={`url(#arrow-${ACCENT.slice(1)})`} />
        <text x={462} y={238} textAnchor="middle" fontSize={11.5} fill={MUTED}>
          returns and docks · wireless charging · UV-C stage
        </text>
        <text x={330} y={44} textAnchor="middle" fontSize={11.5} fill={MUTED}>never moves</text>
        <text x={595} y={44} textAnchor="middle" fontSize={11.5} fill={MUTED}>the only part that travels</text>
      </svg>
      <figcaption className="small muted">Conceptual block diagram. Fluid paths in amber.</figcaption>
    </figure>
  );
}

/** Plan-view workflow: bed + dock on the left, route, disposal point on the right. `pos` 0..1 places the unit. */
export function WorkflowDiagram({ pos, step }: { pos: number; step: number }) {
  const startX = 150;
  const endX = 760;
  const x = startX + (endX - startX) * pos;
  const atDock = pos < 0.05;
  return (
    <svg className="workflow-svg" viewBox="0 0 900 230" role="img" aria-label={`Workflow step ${step + 1} plan view`}>
      <Defs />
      <rect x={20} y={20} width={860} height={190} rx={12} fill="#f3f2ee" />
      {/* bed */}
      <rect x={40} y={40} width={80} height={140} rx={10} fill="#fff" stroke={LINE} strokeWidth={1.5} />
      <rect x={52} y={48} width={56} height={26} rx={8} fill="#eef0f3" />
      <rect x={48} y={84} width={64} height={88} rx={8} fill="#c9d4e4" />
      {/* dock */}
      <rect x={128} y={40} width={50} height={50} rx={4} fill="#d6c9b5" stroke="#b5a68f" />
      <text x={153} y={108} textAnchor="middle" fontSize={11} fill={MUTED}>dock</text>
      <path d="M 112 70 C 120 64, 124 62, 130 62" stroke="#9fb3c5" strokeWidth={2} fill="none" />
      {/* route */}
      <path d={`M ${startX + 3} 90 L ${startX + 3} 160 L ${endX} 160 L ${endX} 70`} fill="none" stroke={ACCENT} strokeWidth={2} strokeDasharray="7 6" opacity={0.6} />
      {/* disposal point */}
      <rect x={endX - 18} y={44} width={36} height={36} rx={4} fill="#c3c9d0" stroke="#8f969f" />
      <text x={endX} y={100} textAnchor="middle" fontSize={11} fill={MUTED}>{T.ui.diagram.workflowEnd}</text>
      {/* unit */}
      {(() => {
        const ux = atDock ? 153 : pos >= 0.99 ? endX : x;
        const uy = atDock ? 65 : pos >= 0.99 ? 62 : 160;
        return (
          <g transform={`translate(${ux} ${uy})`} style={{ transition: "transform 0.5s ease" }}>
            <rect x={-15} y={-12} width={30} height={24} rx={7} fill="#fff" stroke={NAVY} strokeWidth={1.5} />
            <circle cx={0} cy={-3} r={3.5} fill={NAVY} />
          </g>
        );
      })()}
    </svg>
  );
}
