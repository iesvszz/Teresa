/** Static side-view illustration of the mobile unit (used when WebGL is unavailable). */
export function HeroFallback() {
  return (
    <svg className="hero-fallback" viewBox="0 0 400 220" role="img" aria-label="Illustration of the TERESA mobile unit: white rounded body, front LiDAR, four wheels.">
      <ellipse cx="200" cy="196" rx="150" ry="10" fill="#0f1b2d" opacity="0.08" />
      <rect x="70" y="80" width="260" height="100" rx="26" fill="#f4f5f2" stroke="#d5d9df" strokeWidth="2" />
      <rect x="250" y="60" width="44" height="22" rx="6" fill="#1c2129" />
      <rect x="250" y="70" width="44" height="4" fill="#3d6fb0" />
      <rect x="220" y="84" width="70" height="5" rx="2.5" fill="#2f6fd0" />
      <circle cx="120" cy="180" r="24" fill="#23272e" />
      <circle cx="120" cy="180" r="12" fill="#9aa1ab" />
      <circle cx="280" cy="180" r="24" fill="#23272e" />
      <circle cx="280" cy="180" r="12" fill="#9aa1ab" />
    </svg>
  );
}
