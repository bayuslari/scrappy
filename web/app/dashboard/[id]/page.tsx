import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createClient } from "@/lib/supabase/server";
import type { Job } from "@/lib/types";
import SponsorBadge from "@/components/SponsorBadge";
import TechBadge from "@/components/TechBadge";
import JobEditor from "@/components/JobEditor";
import BackLink from "@/components/BackLink";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

function formatSalary(job: Job): string | null {
  const { salary_min, salary_max, salary_currency } = job;
  if (!salary_min && !salary_max) return null;
  const cur = salary_currency ? `${salary_currency} ` : "";
  const fmt = (n: number) => n.toLocaleString();
  if (salary_min && salary_max)
    return `${cur}${fmt(salary_min)}–${fmt(salary_max)}`;
  return `${cur}${fmt((salary_min ?? salary_max) as number)}`;
}

export default async function JobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!data) notFound();
  const job = data as Job;
  const salary = formatSalary(job);

  return (
    <main id="main" className="mx-auto max-w-3xl px-4 py-6">
      <BackLink />

      <div className="mt-3 grid gap-4 md:grid-cols-[1fr_280px]">
        <div>
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold dark:text-slate-100">{job.title}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {job.company || "Unknown company"}
                  {job.location ? ` · ${job.location}` : ""}
                  {job.country ? ` · ${job.country}` : ""}
                </p>
                {salary && (
                  <p className="mt-1 text-base font-semibold text-emerald-700 dark:text-emerald-400">
                    {salary}
                  </p>
                )}
              </div>
              <SponsorBadge value={job.sponsorship_likelihood} />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <TechBadge score={job.tech_score} />
              {job.date_posted && <span>posted {job.date_posted}</span>}
              <span className="capitalize">{job.source}</span>
            </div>

            {job.tech_hits && (
              <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                {job.tech_hits}
              </p>
            )}

            {job.url && (
              <Button asChild className="mt-4">
                <a href={job.url} target="_blank" rel="noopener noreferrer">
                  Open original posting ↗
                </a>
              </Button>
            )}
          </Card>

          {job.description && (
            <Card className="mt-4 p-5">
              <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                Description
              </h2>
              <div className="prose prose-sm prose-slate max-w-none dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {job.description}
                </ReactMarkdown>
              </div>
            </Card>
          )}
        </div>

        <JobEditor
          id={job.id}
          initialStatus={job.status}
          initialNotes={job.notes ?? ""}
        />
      </div>
    </main>
  );
}
