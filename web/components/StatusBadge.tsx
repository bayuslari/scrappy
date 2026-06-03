import type { JobStatus } from "@/lib/types";

const STYLES: Record<JobStatus, string> = {
  new: "bg-slate-100 text-slate-700",
  interested: "bg-blue-100 text-blue-700",
  applied: "bg-indigo-100 text-indigo-700",
  rejected: "bg-red-100 text-red-700",
  skip: "bg-slate-200 text-slate-500",
};

export default function StatusBadge({ value }: { value: JobStatus }) {
  const v = STYLES[value] ? value : "new";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STYLES[v]}`}
    >
      {v}
    </span>
  );
}
