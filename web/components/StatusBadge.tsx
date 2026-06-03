import type { JobStatus } from "@/lib/types";

const STYLES: Record<JobStatus, string> = {
  new: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  interested:
    "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  applied:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  skip: "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

export default function StatusBadge({ value }: { value: JobStatus }) {
  const v = STYLES[value] ? value : "new";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STYLES[v]}`}
    >
      <span className="sr-only">Status: </span>
      {v}
    </span>
  );
}
