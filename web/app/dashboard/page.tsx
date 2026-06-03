import { createClient } from "@/lib/supabase/server";
import type { Job } from "@/lib/types";
import JobCard from "@/components/JobCard";
import FilterBar from "@/components/FilterBar";
import SignOutButton from "@/components/SignOutButton";
import ThemeToggle from "@/components/ThemeToggle";

export const dynamic = "force-dynamic";

type SearchParams = { [key: string]: string | undefined };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createClient();

  const sort = searchParams.sort ?? "date_posted";

  let query = supabase.from("jobs").select("*");

  if (searchParams.country) query = query.eq("country", searchParams.country);
  if (searchParams.sponsorship)
    query = query.eq("sponsorship_likelihood", searchParams.sponsorship);
  if (searchParams.status) query = query.eq("status", searchParams.status);
  if (searchParams.minTech)
    query = query.gte("tech_score", Number(searchParams.minTech));
  if (searchParams.q) {
    const q = searchParams.q.replace(/[%,]/g, " ");
    query = query.or(`title.ilike.%${q}%,company.ilike.%${q}%`);
  }

  query = query
    .order(sort, { ascending: false, nullsFirst: false })
    .limit(500);

  const { data, error } = await query;
  const jobs = (data ?? []) as Job[];

  // Distinct countries present, for the filter dropdown.
  const countries = Array.from(
    new Set(jobs.map((j) => j.country).filter(Boolean) as string[]),
  ).sort();

  return (
    <main id="main" className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Jobs</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {jobs.length} result{jobs.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <SignOutButton />
        </div>
      </div>

      <div className="sticky top-0 z-10 -mx-4 mb-4 bg-slate-50/90 px-4 py-3 backdrop-blur dark:bg-slate-950/90">
        <FilterBar countries={countries} />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          Failed to load jobs: {error.message}
        </p>
      )}

      {jobs.length === 0 && !error ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No jobs match these filters yet. Run the scraper to populate the
          database.
        </p>
      ) : (
        <div className="grid gap-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </main>
  );
}
