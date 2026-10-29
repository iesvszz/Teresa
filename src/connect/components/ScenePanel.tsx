import { Suspense, lazy, useState } from "react";
import type { TeresaUnitId, WardState } from "../../teresa/types";
import { distanceProgressText } from "./sceneCaption";
import { FULL_MODEL_MODES, FULL_VIEWS, MODEL_LABELS, PUBLIC_MODEL_MODES, PUBLIC_VIEWS, VIEW_LABELS, type ModelMode, type ViewMode } from "../../three/types";
import { PageLoading } from "../../components/PageLoading";

const WardScene = lazy(() => import("../../three/WardScene"));

const VIEWS = __TERESA_FULL__ ? FULL_VIEWS : PUBLIC_VIEWS;
const MODES = __TERESA_FULL__ ? FULL_MODEL_MODES : PUBLIC_MODEL_MODES;

export function ScenePanel({
  ward,
  unitId,
  onSelect,
  height = 560,
  showModelModes = true,
}: {
  ward: WardState;
  unitId: TeresaUnitId;
  onSelect: (id: TeresaUnitId) => void;
  height?: number;
  showModelModes?: boolean;
}) {
  const [view, setView] = useState<ViewMode>("overview");
  const [mode, setMode] = useState<ModelMode>("assembled");
  const u = ward.units[unitId];

  return (
    <section className="card scene-panel" aria-labelledby="scene-title">
      <div className="scene-panel__bar">
        <div>
          <h2 id="scene-title" className="scene-panel__title">
            Ward simulation <span className="muted">· {u.label} selected</span>
          </h2>
          <p className="small muted scene-panel__sub">Conceptual 3D model — not to scale · one shared disposal point · drag to orbit, scroll or pinch to zoom, click a unit to select it</p>
        </div>
        <div className="scene-panel__controls">
          <div className="segmented" role="group" aria-label="Camera view">
            {VIEWS.map((v) => (
              <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}>
                {VIEW_LABELS[v]}
              </button>
            ))}
          </div>
          {showModelModes && MODES.length > 1 && (
            <div className="segmented" role="group" aria-label="Model mode">
              {MODES.map((m) => (
                <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)}>
                  {MODEL_LABELS[m]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <Suspense fallback={<div style={{ height }} className="scene-wrap"><PageLoading label="Loading 3D ward…" /></div>}>
        <WardScene unitId={unitId} view={view} modelMode={mode} onSelectUnit={onSelect} height={height} />
      </Suspense>
      <p className="scene-panel__caption small">
        <span className="tag tag-sim">Simulation</span> {distanceProgressText(u)}
      </p>
      <p className="sr-only" aria-live="polite">
        {u.label}: {u.stage}
      </p>
    </section>
  );
}
