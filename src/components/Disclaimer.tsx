export const DISCLAIMER =
  "TERESA is a research prototype concept. It is not a medical device and is not approved for patient use. Patient use would require engineering verification, risk assessment, and clinical and safety review.";

export function Disclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <p className={`disclaimer${compact ? " disclaimer--compact" : ""}`} role="note">
      {DISCLAIMER}
    </p>
  );
}
