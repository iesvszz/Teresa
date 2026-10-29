export function SimBadge() {
  return (
    <span className="tag tag-sim sim-badge" title="Simulated values — not sensor data">
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
        <circle cx="5" cy="5" r="4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2 1.6" />
      </svg>
      Simulation data
    </span>
  );
}
