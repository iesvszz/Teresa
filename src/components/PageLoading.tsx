export function PageLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="page-loading" role="status" aria-live="polite">
      <span className="page-loading__bar" aria-hidden="true" />
      <span className="small muted">{label}</span>
    </div>
  );
}
