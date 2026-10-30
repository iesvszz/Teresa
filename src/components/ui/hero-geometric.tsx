import { Suspense, lazy, useCallback, useState, type ComponentPropsWithoutRef } from "react";
import { motion } from "motion/react";
import { SceneBoundary } from "../../three/SceneSupport";
import { hasWebGL } from "../../three/webgl";
import { usePrefersReducedMotion } from "../../teresa/hooks";

const HeroGeometricCanvas = lazy(() => import("./hero-geometric-canvas"));

const FALLBACK_COLOR_1 = "#3B82F6";
const FALLBACK_COLOR_2 = "#F0F9FF";
const HEX_COLOR = /^#?[0-9a-fA-F]{6}$/;

function sanitizeHex(value: string, fallback: string) {
  const v = value.trim();
  if (!HEX_COLOR.test(v)) return fallback;
  return v.startsWith("#") ? v : `#${v}`;
}

interface HeroGeometricProps extends ComponentPropsWithoutRef<"div"> {
  title1?: string;
  title2?: string;
  description?: string;
  color1?: string;
  color2?: string;
  speed?: number;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Full-screen hero with an animated, dithered shader gradient behind the content.
 * Adapted from componentry's HeroGeometric for plain CSS; the WebGL canvas is lazy-loaded
 * and falls back to a CSS gradient when WebGL is unavailable.
 */
export default function HeroGeometric({
  title1,
  title2,
  description,
  color1 = FALLBACK_COLOR_1,
  color2 = FALLBACK_COLOR_2,
  speed = 1,
  className,
  style,
  children,
  ...props
}: HeroGeometricProps) {
  const [webgl, setWebgl] = useState(() => hasWebGL());
  const onFail = useCallback(() => setWebgl(false), []);
  const reduced = usePrefersReducedMotion();
  const c1 = sanitizeHex(color1, FALLBACK_COLOR_1);
  const c2 = sanitizeHex(color2, FALLBACK_COLOR_2);
  const fallback = <div className="hero-geo__fallback" style={{ background: `linear-gradient(45deg, #fff 0%, ${c1} 18%, ${c2} 85%)` }} />;

  return (
    <div {...props} className={`hero-geo${className ? ` ${className}` : ""}`} style={style}>
      <div className="hero-geo__bg" aria-hidden="true">
        {webgl ? (
          <SceneBoundary fallback={fallback}>
            <Suspense fallback={fallback}>
              <HeroGeometricCanvas color1={c1} color2={c2} speed={reduced ? speed * 0.35 : speed} onFail={onFail} />
            </Suspense>
          </SceneBoundary>
        ) : (
          fallback
        )}
      </div>

      <div className="hero-geo__content">
        {(title1 || title2) && (
          <div className="hero-geo__titles">
            {[title1, title2].map((t, i) =>
              t ? (
                <div key={i} className="hero-geo__clip">
                  <motion.h1
                    className="hero-geo__headline"
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: "0%", opacity: 1 }}
                    transition={{ duration: 1, ease: EASE, delay: 0.2 + i * 0.15 }}
                  >
                    {t}
                  </motion.h1>
                </div>
              ) : null,
            )}
          </div>
        )}
        {description && (
          <motion.p
            className="hero-geo__description"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          >
            {description}
          </motion.p>
        )}
        {children}
      </div>
    </div>
  );
}
