import Link from "next/link";
import type { Job } from "@/lib/types";
import SponsorBadge from "./SponsorBadge";
import StatusBadge from "./StatusBadge";
import TechBadge from "./TechBadge";

function formatSalary(job: Job): string | null {
  const { salary_min, salary_max, salary_currency } = job;
  if (!salary_min && !salary_max) return null;
  const cur = salary_currency ? `${salary_currency} ` : "";
  const fmt = (n: number) => n.toLocaleString();
  if (salary_min && salary_max)
    return `${cur}${fmt(salary_min)}–${fmt(salary_max)}`;
  return `${cur}${fmt((salary_min ?? salary_max) as number)}`;
}

export default function JobCard({ job }: { job: Job }) {
  const salary = formatSalary(job);
  return (
    <Link
      href={`/dashboard/${job.id}`}
      className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-medium text-slate-900 dark:text-slate-100">
            {job.title}
          </h3>
          <p className="truncate text-sm text-slate-500 dark:text-slate-400">
            {job.company || "Unknown company"}
            {job.location ? ` · ${job.location}` : ""}
            {job.country ? ` · ${job.country}` : ""}
          </p>
          {salary && (
            <p className="mt-0.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
              {salary}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <SponsorBadge value={job.sponsorship_likelihood} />
          <StatusBadge value={job.status} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
        <TechBadge score={job.tech_score} />
        {job.date_posted && <span>posted {job.date_posted}</span>}
        <span className="capitalize">{job.source}</span>
      </div>

      {job.tech_hits && (
        <p className="mt-2 truncate text-xs text-slate-400 dark:text-slate-500">
          {job.tech_hits}
        </p>
      )}
    </Link>
  );
}
