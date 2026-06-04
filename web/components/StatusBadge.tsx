import type { JobStatus } from "@/lib/types";

const STYLES: Record<JobStatus, string> = {
  new: "bg-sky-500 text-white",
  interested: "bg-violet-500 text-white",
  applied: "bg-indigo-600 text-white",
  rejected: "bg-rose-500 text-white",
  skip: "bg-slate-400 text-white dark:bg-slate-600",
};

export default function StatusBadge({ value }: { value: JobStatus }) {
  const v = STYLES[value] ? value : "new";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize shadow-sm ${STYLES[v]}`}
    >
      <span className="sr-only">Status: </span>
      {v}
    </span>
  );
}
