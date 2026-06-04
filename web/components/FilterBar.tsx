"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { STATUSES, SPONSORSHIPS } from "@/lib/types";

const COUNTRIES = ["AU", "NZ", "UK"];
const SORTS = [
  { value: "date_posted", label: "Date posted" },
  { value: "tech_score", label: "Tech score" },
  { value: "salary_max", label: "Salary" },
];

export default function FilterBar({ countries }: { countries: string[] }) {
  const router = useRouter();
  const params = useSearchParams();

  const countryOpts = countries.length ? countries : COUNTRIES;

  // Controlled search with 300 ms debounce — fixes defaultValue reset bug.
  const [q, setQ] = useState(params.get("q") ?? "");
  useEffect(() => { setQ(params.get("q") ?? ""); }, [params]);
  useEffect(() => {
    const t = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (q) next.set("q", q); else next.delete("q");
      router.push(`/dashboard?${next.toString()}`);
    }, 300);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const update = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      router.push(`/dashboard?${next.toString()}`);
    },
    [params, router],
  );

  const selectCls =
    "rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-400";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        id="filter-q"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search title / company…"
        className={`${selectCls} min-w-[200px] flex-1 placeholder:text-slate-400 dark:placeholder:text-slate-500`}
        aria-label="Search jobs by title or company"
      />

      <select
        value={params.get("country") ?? ""}
        onChange={(e) => update("country", e.target.value)}
        className={selectCls}
        aria-label="Filter by country"
      >
        <option value="">All countries</option>
        {countryOpts.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <select
        value={params.get("sponsorship") ?? ""}
        onChange={(e) => update("sponsorship", e.target.value)}
        className={selectCls}
        aria-label="Filter by sponsorship likelihood"
      >
        <option value="">All sponsorship</option>
        {SPONSORSHIPS.map((s) => (
          <option key={s} value={s} className="capitalize">{s}</option>
        ))}
      </select>

      <select
        value={params.get("status") ?? ""}
        onChange={(e) => update("status", e.target.value)}
        className={selectCls}
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s} className="capitalize">{s}</option>
        ))}
      </select>

      <select
        value={params.get("minTech") ?? ""}
        onChange={(e) => update("minTech", e.target.value)}
        className={selectCls}
        aria-label="Filter by minimum tech score"
      >
        <option value="">Any tech score</option>
        {[2, 4, 6, 8].map((n) => (
          <option key={n} value={String(n)}>tech ≥ {n}</option>
        ))}
      </select>

      <select
        value={params.get("hasSalary") ?? ""}
        onChange={(e) => update("hasSalary", e.target.value)}
        className={selectCls}
        aria-label="Filter by salary availability"
      >
        <option value="">Any salary</option>
        <option value="yes">Has salary</option>
      </select>

      <select
        value={params.get("sort") ?? "date_posted"}
        onChange={(e) => update("sort", e.target.value)}
        className={selectCls}
        aria-label="Sort jobs"
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>Sort: {s.label}</option>
        ))}
      </select>
    </div>
  );
}
