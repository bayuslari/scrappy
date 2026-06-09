import Link from "next/link";
import type { Job } from "@/lib/types";
import SponsorBadge from "./SponsorBadge";
import StatusBadge from "./StatusBadge";
import TechBadge from "./TechBadge";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPosted, isToday } from "@/lib/date";

function formatSalary(job: Job): string | null {
  const { salary_min, salary_max, salary_currency } = job;
  if (!salary_min && !salary_max) return null;
  const cur = salary_currency ? `${salary_currency} ` : "";
  const fmt = (n: number) => n.toLocaleString();
  if (salary_min && salary_max)
    return `${cur}${fmt(salary_min)}–${fmt(salary_max)}`;
  return `${cur}${fmt((salary_min ?? salary_max) as number)}`;
}

// Deterministic avatar colour from the company name so cards aren't monotone.
const AVATAR_COLORS = [
  "bg-rose-500", "bg-orange-500", "bg-amber-500", "bg-lime-500",
  "bg-emerald-500", "bg-teal-500", "bg-sky-500", "bg-indigo-500",
  "bg-violet-500", "bg-fuchsia-500",
];
function avatarFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function tagsOf(job: Job): string[] {
  if (!job.tech_hits) return [];
  return job.tech_hits
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 6);
}

export default function JobCard({ job }: { job: Job }) {
  const salary = formatSalary(job);
  const company = job.company || "Unknown company";
  const tags = tagsOf(job);
  const posted = formatPosted(job.date_posted);
  const today = isToday(job.date_posted);
  const isRemote = (job.location ?? "").toLowerCase().includes("remote");

  return (
    <Link href={`/dashboard/${job.id}`} className="block">
      <Card className="flex gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-md dark:hover:border-slate-700">
        {/* Company avatar */}
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-base font-bold text-white ${avatarFor(company)}`}
          aria-hidden="true"
        >
          {company.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-slate-900 dark:text-slate-100">
                {job.title}
              </h3>
              <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                {company}
                {job.location ? (
                  <>
                    {" · "}
                    {isRemote && <span aria-hidden="true">🌍 </span>}
                    {job.location}
                  </>
                ) : null}
                {job.country ? ` · ${job.country}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <SponsorBadge value={job.sponsorship_likelihood} />
              <StatusBadge value={job.status} />
            </div>
          </div>

          {/* Tag pills */}
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <Badge key={t} variant="secondary" className="font-medium">
                  {t}
                </Badge>
              ))}
            </div>
          )}

          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <TechBadge score={job.tech_score} />
            {salary && (
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {salary}
              </span>
            )}
            {posted && (
              <span className={today ? "font-semibold text-emerald-600 dark:text-emerald-400" : ""}>
                {posted}
              </span>
            )}
            <Badge variant="outline" className="capitalize">{job.source}</Badge>
          </div>
        </div>
      </Card>
    </Link>
  );
}
