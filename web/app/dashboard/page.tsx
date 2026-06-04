import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Job } from "@/lib/types";
import { buildJobsQuery, readFilters, filtersToQuery, PAGE_SIZE } from "@/lib/jobsQuery";
import JobList from "@/components/JobList";
import FilterBar from "@/components/FilterBar";
import SignOutButton from "@/components/SignOutButton";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type SearchParams = { [key: string]: string | undefined };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createClient();
  const filters = readFilters(searchParams);
  const query = filtersToQuery(filters);

  // Load only the first page server-side; the rest lazy-loads on scroll.
  // `withCount` asks Postgres for the total number of matching rows.
  const { data, error, count } = await buildJobsQuery(
    supabase,
    filters,
    0,
    PAGE_SIZE - 1,
    true,
  );
  const jobs = (data ?? []) as Job[];
  const total = count ?? jobs.length;

  return (
    <main id="main" className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">Jobs</h1>
          <p className="text-sm text-muted-foreground">
            {total} result{total === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/settings">Settings</Link>
          </Button>
          <ThemeToggle />
          <SignOutButton />
        </div>
      </div>

      <div className="sticky top-0 z-10 -mx-4 mb-4 bg-slate-50/90 px-4 py-3 backdrop-blur dark:bg-slate-950/90">
        <Suspense>
          <FilterBar countries={[]} />
        </Suspense>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          Failed to load jobs: {error.message}
        </p>
      )}

      {jobs.length === 0 && !error ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No jobs match these filters yet.
        </p>
      ) : (
        <JobList initialJobs={jobs} query={query} />
      )}
    </main>
  );
}
