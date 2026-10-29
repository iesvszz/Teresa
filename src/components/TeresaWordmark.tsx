/**
 * TERESA wordmark: thin, wide-tracked geometric capitals; the final A is a Λ (no crossbar).
 * Drawn as strokes so it stays crisp at any size and follows `currentColor`.
 */
export function TeresaWordmark({ height = 20, className, title = "TERESA" }: { height?: number; className?: string; title?: string }) {
  return (
    <svg className={className} height={height} viewBox="0 0 640 100" role="img" aria-label={title} fill="none" stroke="currentColor" strokeWidth={6} strokeLinecap="butt" strokeLinejoin="miter">
      <title>{title}</title>
      {/* T */}
      <path d="M0 13 H66 M33 13 V90" />
      {/* E */}
      <path d="M118 13 H172 M121 13 V90 M118 51 H166 M118 87 H174" />
      {/* R */}
      <path d="M232 90 V13 H264 C282 13 292 23 292 37 C292 51 282 61 264 61 H232 M262 61 L296 90" />
      {/* E */}
      <path d="M350 13 H404 M353 13 V90 M350 51 H398 M350 87 H406" />
      {/* S */}
      <path d="M512 24 C504 15 494 12 482 12 C467 12 457 20 457 32 C457 58 516 46 516 71 C516 84 504 91 488 91 C474 91 462 86 454 77" />
      {/* Λ */}
      <path d="M568 90 L603 12 L638 90" />
    </svg>
  );
}
