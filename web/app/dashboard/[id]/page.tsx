import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Job } from "@/lib/types";
import SponsorBadge from "@/components/SponsorBadge";
import JobEditor from "@/components/JobEditor";

export const dynamic = "force-dynamic";

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

  return (
    <main id="main" className="mx-auto max-w-3xl px-4 py-6">
      <Link
        href="/dashboard"
        className="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      >
        ← Back to jobs
      </Link>

      <div className="mt-3 grid gap-4 md:grid-cols-[1fr_280px]">
        <div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold">{job.title}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {job.company || "Unknown company"}
                  {job.location ? ` · ${job.location}` : ""}
                  {job.country ? ` · ${job.country}` : ""}
                </p>
              </div>
              <SponsorBadge value={job.sponsorship_likelihood} />
            </div>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                tech {job.tech_score}/10
              </span>
              {(job.salary_min || job.salary_max) && (
                <span>
                  {job.salary_currency} {job.salary_min ?? "?"}–
                  {job.salary_max ?? "?"}
                </span>
              )}
              {job.date_posted && <span>posted {job.date_posted}</span>}
              <span className="capitalize">{job.source}</span>
            </div>

            {job.tech_hits && (
              <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                {job.tech_hits}
              </p>
            )}

            {job.url && (
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                Open original posting ↗
              </a>
            )}
          </div>

          {job.description && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                Description
              </h2>
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {job.description}
              </div>
            </div>
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
