import { useOutletContext } from "react-router-dom";
import type { TeresaUnitId } from "../teresa/types";

export interface ConnectContext {
  unitId: TeresaUnitId;
  select: (id: TeresaUnitId) => void;
  /** Query string that keeps the selected unit when navigating between Connect pages. */
  search: string;
}

export const useConnect = () => useOutletContext<ConnectContext>();
