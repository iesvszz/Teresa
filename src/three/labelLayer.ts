import { createContext } from "react";

/**
 * DOM layer (a sibling of the <Canvas>) that scene labels are placed into.
 * WardScene provides it; r3f bridges the context into the canvas tree.
 */
export const LabelLayerContext = createContext<HTMLElement | null>(null);
