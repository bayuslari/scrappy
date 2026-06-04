// Shared job-list query builder used by the dashboard server page and the
// /api/jobs route (infinite scroll), so filtering/sorting stay identical.
import type { SupabaseClient } from "@supabase/supabase-js";

export const PAGE_SIZE = 30;

export type JobFilters = {
  country?: string;
  sponsorship?: string;
  status?: string;
  minTech?: string;
  hasSalary?: string;
  q?: string;
  sort?: string;
};

const FILTER_KEYS: (keyof JobFilters)[] = [
  "country",
  "sponsorship",
  "status",
  "minTech",
  "hasSalary",
  "q",
  "sort",
];

/** Pull known filter keys out of a URLSearchParams / plain object. */
export function readFilters(
  source: URLSearchParams | Record<string, string | undefined>,
): JobFilters {
  const get = (k: string) =>
    source instanceof URLSearchParams ? source.get(k) ?? undefined : source[k];
  const f: JobFilters = {};
  for (const k of FILTER_KEYS) {
    const v = get(k);
    if (v) f[k] = v;
  }
  return f;
}

/** Re-encode filters as a query string (without the page param). */
export function filtersToQuery(f: JobFilters): string {
  const p = new URLSearchParams();
  for (const k of FILTER_KEYS) {
    const v = f[k];
    if (v) p.set(k, v);
  }
  return p.toString();
}

export function buildJobsQuery(
  supabase: SupabaseClient,
  f: JobFilters,
  from: number,
  to: number,
) {
  const sort = f.sort ?? "date_posted";
  let query = supabase.from("jobs").select("*");

  if (f.country) query = query.eq("country", f.country);
  if (f.sponsorship) query = query.eq("sponsorship_likelihood", f.sponsorship);
  if (f.status) query = query.eq("status", f.status);
  if (f.minTech) query = query.gte("tech_score", Number(f.minTech));
  if (f.hasSalary === "yes") query = query.not("salary_min", "is", null);
  if (f.q) {
    const q = f.q.replace(/[%,]/g, " ");
    query = query.or(`title.ilike.%${q}%,company.ilike.%${q}%`);
  }

  return query
    .order(sort, { ascending: false, nullsFirst: false })
    .range(from, to);
}
