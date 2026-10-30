import { useContext, useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3, type Group } from "three";
import { LabelLayerContext } from "./labelLayer";

const projected = new Vector3();

/**
 * A text label pinned to a 3D point. Replaces drei's <Html>, which mounts a separate React
 * root per label and throws on teardown under React 19 (removeChild on an already-detached node).
 * This is a plain element moved with a transform each frame — no extra React roots.
 */
export function SceneLabel({
  position,
  className,
  text,
  zIndex = 10,
}: {
  position: [number, number, number];
  className: string;
  text: string;
  zIndex?: number;
}) {
  const layer = useContext(LabelLayerContext);
  const anchor = useRef<Group>(null);
  const el = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!layer) return;
    const node = document.createElement("div");
    node.style.position = "absolute";
    node.style.left = "0";
    node.style.top = "0";
    node.style.visibility = "hidden";
    node.style.willChange = "transform";
    layer.appendChild(node);
    el.current = node;
    return () => {
      node.remove();
      el.current = null;
    };
  }, [layer]);

  useLayoutEffect(() => {
    const node = el.current;
    if (!node) return;
    node.className = className;
    node.textContent = text;
    node.style.zIndex = String(zIndex);
  }, [className, text, zIndex, layer]);

  useFrame(({ camera, size }) => {
    const node = el.current;
    const a = anchor.current;
    if (!node || !a) return;
    a.getWorldPosition(projected).project(camera);
    if (projected.z < -1 || projected.z > 1) {
      node.style.visibility = "hidden";
      return;
    }
    const x = (projected.x * 0.5 + 0.5) * size.width;
    const y = (-projected.y * 0.5 + 0.5) * size.height;
    node.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
    node.style.visibility = "visible";
  });

  return <group ref={anchor} position={position} />;
}
