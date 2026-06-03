"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
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
    "rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-slate-900";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        defaultValue={params.get("q") ?? ""}
        onChange={(e) => update("q", e.target.value)}
        placeholder="Search title / company…"
        className={`${selectCls} min-w-[200px] flex-1`}
      />

      <select
        value={params.get("country") ?? ""}
        onChange={(e) => update("country", e.target.value)}
        className={selectCls}
      >
        <option value="">All countries</option>
        {countryOpts.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <select
        value={params.get("sponsorship") ?? ""}
        onChange={(e) => update("sponsorship", e.target.value)}
        className={selectCls}
      >
        <option value="">All sponsorship</option>
        {SPONSORSHIPS.map((s) => (
          <option key={s} value={s} className="capitalize">
            {s}
          </option>
        ))}
      </select>

      <select
        value={params.get("status") ?? ""}
        onChange={(e) => update("status", e.target.value)}
        className={selectCls}
      >
        <option value="">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s} className="capitalize">
            {s}
          </option>
        ))}
      </select>

      <select
        value={params.get("minTech") ?? ""}
        onChange={(e) => update("minTech", e.target.value)}
        className={selectCls}
      >
        <option value="">Any tech score</option>
        {[2, 4, 6, 8].map((n) => (
          <option key={n} value={String(n)}>
            tech ≥ {n}
          </option>
        ))}
      </select>

      <select
        value={params.get("sort") ?? "date_posted"}
        onChange={(e) => update("sort", e.target.value)}
        className={selectCls}
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            Sort: {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}
