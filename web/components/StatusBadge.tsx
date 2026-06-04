import type { JobStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

const VARIANTS = {
  new: "sky",
  interested: "violet",
  applied: "indigo",
  rejected: "rose",
  skip: "slate",
} as const;

export default function StatusBadge({ value }: { value: JobStatus }) {
  const v = VARIANTS[value] ? value : "new";
  return (
    <Badge variant={VARIANTS[v]} className="capitalize">
      <span className="sr-only">Status: </span>
      {v}
    </Badge>
  );
}
