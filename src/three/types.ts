import { T } from "../teresa/text";

export type ViewMode = "overview" | "side" | "top" | "bottom" | "closeup";
export type ModelMode = "assembled" | "internal" | "drainage";

export const VIEW_LABELS: Record<ViewMode, string> = {
  overview: "Overview",
  side: "Side",
  top: "Top",
  bottom: T.ui.viewBottom,
  closeup: "Close-up",
};

export const MODEL_LABELS: Record<ModelMode, string> = {
  assembled: "Assembled",
  internal: T.ui.modeInternal,
  drainage: T.ui.modeDrainage,
};

/** Views and model modes available in the public (paper) build. */
export const PUBLIC_VIEWS: ViewMode[] = ["overview", "side", "top", "closeup"];
export const FULL_VIEWS: ViewMode[] = ["overview", "side", "top", "bottom", "closeup"];
export const PUBLIC_MODEL_MODES: ModelMode[] = ["assembled"];
export const FULL_MODEL_MODES: ModelMode[] = ["assembled", "internal", "drainage"];
