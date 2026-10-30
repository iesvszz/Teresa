import { Suspense, lazy, useCallback, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import type { TeresaUnitId, WardState } from "../../teresa/types";
import { distanceProgressText } from "./sceneCaption";
import { FULL_MODEL_MODES, FULL_VIEWS, MODEL_LABELS, PUBLIC_MODEL_MODES, PUBLIC_VIEWS, VIEW_LABELS, type ModelMode, type ViewMode } from "../../three/types";
import { PageLoading } from "../../components/PageLoading";
import { SceneModal, type OriginRect } from "./SceneModal";

const WardScene = lazy(() => import("../../three/WardScene"));

const VIEWS = __TERESA_FULL__ ? FULL_VIEWS : PUBLIC_VIEWS;
const MODES = __TERESA_FULL__ ? FULL_MODEL_MODES : PUBLIC_MODEL_MODES;

/**
 * The ward as a live preview. Clicking it opens the full interactive view in a dialog
 * that grows out of the preview; the preview pauses while the dialog is open.
 */
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
  const [expanded, setExpanded] = useState(false);
  const [origin, setOrigin] = useState<OriginRect | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const u = ward.units[unitId];

  const open = () => {
    const r = stageRef.current?.getBoundingClientRect();
    setOrigin(r ? { x: r.x, y: r.y, width: r.width, height: r.height } : null);
    setExpanded(true);
  };
  const close = useCallback(() => {
    // Re-measure so the dialog shrinks back to wherever the preview is now.
    const r = stageRef.current?.getBoundingClientRect();
    if (r) setOrigin({ x: r.x, y: r.y, width: r.width, height: r.height });
    setExpanded(false);
  }, []);

  return (
    <section className="card scene-panel" aria-labelledby="scene-title">
      <div className="scene-panel__bar">
        <div>
          <p className="panel__label">Ward simulation</p>
          <h2 id="scene-title" className="scene-panel__title">
            {u.label} <span className="muted">selected</span>
          </h2>
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

      <div ref={stageRef} className={`scene-preview${expanded ? " is-expanded" : ""}`}>
        <Suspense fallback={<div style={{ height }} className="scene-wrap"><PageLoading label="Loading 3D ward…" /></div>}>
          <WardScene unitId={unitId} view={view} modelMode={mode} onSelectUnit={onSelect} height={height} active={!expanded} />
        </Suspense>
        <button type="button" className="scene-preview__open" onClick={open} aria-label="Open the 3D ward in a larger interactive view">
          <span className="scene-preview__chip">Click to expand</span>
        </button>
      </div>

      <p className="scene-panel__caption small">
        <span className="tag tag-sim">Simulation</span> {distanceProgressText(u)}
      </p>
      <p className="sr-only" aria-live="polite">
        {u.label}: {u.stage}
      </p>

      <AnimatePresence>
        {expanded && (
          <SceneModal
            key="scene-modal"
            ward={ward}
            unitId={unitId}
            onSelect={onSelect}
            view={view}
            views={VIEWS}
            onView={setView}
            mode={mode}
            origin={origin}
            onClose={close}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
