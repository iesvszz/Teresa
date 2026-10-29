export type ContentStatus = "published" | "proposed" | "untested" | "simulated";

const LABEL: Record<ContentStatus, string> = {
  published: "Published",
  proposed: "Proposed",
  untested: "Not yet tested",
  simulated: "Simulated",
};

const CLASS: Record<ContentStatus, string> = {
  published: "tag-published",
  proposed: "tag-proposed",
  untested: "tag-untested",
  simulated: "tag-sim",
};

export function StatusTag({ status }: { status: ContentStatus }) {
  return <span className={`tag ${CLASS[status]}`}>{LABEL[status]}</span>;
}
