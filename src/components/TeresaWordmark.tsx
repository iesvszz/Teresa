import { WORDMARK_PATHS } from "./wordmarkPaths";

/**
 * TERESA wordmark: thin, wide-tracked geometric capitals; the final A is a Λ (no crossbar).
 * Drawn as strokes so it stays crisp at any size and follows `currentColor`.
 */
export function TeresaWordmark({ height = 20, className, title = "TERESA" }: { height?: number; className?: string; title?: string }) {
  return (
    <svg className={className} height={height} viewBox="0 0 640 100" role="img" aria-label={title} fill="none" stroke="currentColor" strokeWidth={6} strokeLinecap="butt" strokeLinejoin="miter">
      <title>{title}</title>
      {WORDMARK_PATHS.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
