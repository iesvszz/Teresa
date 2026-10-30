import { Suspense, lazy, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { UNIT_IDS, type TeresaUnitId, type WardState } from "../../teresa/types";
import { usePrefersReducedMotion } from "../../teresa/hooks";
import { VIEW_LABELS, type ModelMode, type ViewMode } from "../../three/types";
import { PageLoading } from "../../components/PageLoading";
import { distanceProgressText } from "./sceneCaption";

const WardScene = lazy(() => import("../../three/WardScene"));

/** Where the inline preview sat on screen, so the dialog can grow out of it and shrink back. */
export interface OriginRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const SPRING = { type: "spring", stiffness: 260, damping: 30, mass: 0.9 } as const;

function fromOrigin(origin: OriginRect | null) {
  if (!origin || typeof window === "undefined") return { opacity: 0, scale: 0.94 };
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const dialogW = Math.min(1480, vw - 48);
  return {
    opacity: 0,
    x: origin.x + origin.width / 2 - vw / 2,
    y: origin.y + origin.height / 2 - vh / 2,
    scale: Math.max(0.3, Math.min(1, origin.width / dialogW)),
  };
}

export function SceneModal({
  ward,
  unitId,
  onSelect,
  view,
  views,
  onView,
  mode,
  origin,
  onClose,
}: {
  ward: WardState;
  unitId: TeresaUnitId;
  onSelect: (id: TeresaUnitId) => void;
  view: ViewMode;
  views: readonly ViewMode[];
  onView: (v: ViewMode) => void;
  mode: ModelMode;
  origin: OriginRect | null;
  onClose: () => void;
}) {
  const reduced = usePrefersReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);

  const u = ward.units[unitId];
  const hidden = reduced ? { opacity: 0 } : fromOrigin(origin);

  // Lock page scroll, focus the dialog, close on Escape, and hand focus back on close.
  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus({ preventScroll: true });
    };
  }, [onClose]);

  return createPortal(
    <div className="scene-modal" role="presentation">
      <motion.div
        className="scene-modal__backdrop"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduced ? 0 : 0.35, ease: "easeOut" }}
        aria-hidden="true"
      />
      <motion.div
        className="scene-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scene-modal-title"
        initial={hidden}
        animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
        exit={hidden}
        transition={reduced ? { duration: 0 } : SPRING}
      >
        <header className="scene-modal__bar">
          <div>
            <p className="scene-modal__label">Live ward · simulated</p>
            <h2 id="scene-modal-title" className="scene-modal__title">
              {u.label} <span>{u.bed}</span>
            </h2>
          </div>
          <div className="scene-modal__controls">
            <div className="segmented" role="group" aria-label="Camera view">
              {views.map((v) => (
                <button key={v} type="button" aria-pressed={view === v} onClick={() => onView(v)}>
                  {VIEW_LABELS[v]}
                </button>
              ))}
            </div>
            <button ref={closeRef} type="button" className="btn btn-sm scene-modal__close" onClick={onClose}>
              Close <kbd>Esc</kbd>
            </button>
          </div>
        </header>

        <div className="scene-modal__stage">
          <Suspense fallback={<div className="scene-wrap" style={{ height: "100%" }}><PageLoading label="Loading 3D ward…" /></div>}>
            <WardScene unitId={unitId} view={view} modelMode={mode} onSelectUnit={onSelect} height="100%" />
          </Suspense>
        </div>

        <footer className="scene-modal__foot">
          <div className="scene-modal__units" role="group" aria-label="Select unit">
            {UNIT_IDS.map((id) => (
              <button key={id} type="button" aria-pressed={id === unitId} onClick={() => onSelect(id)} className={`cond-${ward.units[id].condition}`}>
                {ward.units[id].label}
              </button>
            ))}
          </div>
          <p className="scene-modal__status" aria-live="polite">{distanceProgressText(u)}</p>
          <p className="scene-modal__hint">Drag to orbit · scroll to zoom · click a unit to select</p>
        </footer>
      </motion.div>
    </div>,
    document.body,
  );
}
