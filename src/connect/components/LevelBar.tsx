export function LevelBar({ value, tone = "fluid", label }: { value: number; tone?: "fluid" | "battery" | "accent"; label: string }) {
  const v = Math.max(0, Math.min(100, value));
  const low = tone === "battery" && v < 25;
  return (
    <div className={`level level--${tone}${low ? " level--low" : ""}`} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v)} aria-label={label}>
      <div className="level__fill" style={{ width: `${v}%` }} />
    </div>
  );
}
