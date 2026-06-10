"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { STATUSES, SPONSORSHIPS } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COUNTRIES = ["AU", "NZ", "UK", "SG", "MY"];
const SORTS = [
  { value: "date_posted", label: "Date posted" },
  { value: "tech_score", label: "Tech score" },
  { value: "salary_max", label: "Salary" },
];

// Radix Select can't use "" as an item value, so "all" is the sentinel for
// "no filter" and maps back to an empty query param.
const ALL = "all";

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
      router.push(`/dashboard?${next.toString()}`, { scroll: false });
    }, 300);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const update = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value && value !== ALL) next.set(key, value);
      else next.delete(key);
      router.push(`/dashboard?${next.toString()}`, { scroll: false });
    },
    [params, router],
  );

  const remote = params.get("remote") === "yes";
  const relocation = params.get("relocation") === "yes";

  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
      <Input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search title / company…"
        className="col-span-2 sm:w-56 sm:flex-1"
        aria-label="Search jobs by title or company"
      />

      <Select
        value={params.get("country") ?? ALL}
        onValueChange={(v) => update("country", v)}
      >
        <SelectTrigger className="w-full sm:w-[140px]" aria-label="Filter by country">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All countries</SelectItem>
          {countryOpts.map((c) => (
            <SelectItem key={c} value={c}>{c}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={params.get("sponsorship") ?? ALL}
        onValueChange={(v) => update("sponsorship", v)}
      >
        <SelectTrigger className="w-full sm:w-[150px] capitalize" aria-label="Filter by sponsorship likelihood">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All sponsorship</SelectItem>
          {SPONSORSHIPS.map((s) => (
            <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={params.get("status") ?? ALL}
        onValueChange={(v) => update("status", v)}
      >
        <SelectTrigger className="w-full sm:w-[140px] capitalize" aria-label="Filter by status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All statuses</SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={params.get("minTech") ?? ALL}
        onValueChange={(v) => update("minTech", v)}
      >
        <SelectTrigger className="w-full sm:w-[140px]" aria-label="Filter by minimum tech score">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Any tech score</SelectItem>
          {[2, 4, 6, 8].map((n) => (
            <SelectItem key={n} value={String(n)}>tech ≥ {n}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={params.get("hasSalary") ?? ALL}
        onValueChange={(v) => update("hasSalary", v)}
      >
        <SelectTrigger className="w-full sm:w-[130px]" aria-label="Filter by salary availability">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Any salary</SelectItem>
          <SelectItem value="yes">Has salary</SelectItem>
        </SelectContent>
      </Select>

      <Button
        type="button"
        size="sm"
        variant={remote ? "default" : "outline"}
        aria-pressed={remote}
        onClick={() => update("remote", remote ? "" : "yes")}
        className="w-full sm:w-auto"
      >
        🌐 Remote
      </Button>

      <Button
        type="button"
        size="sm"
        variant={relocation ? "default" : "outline"}
        aria-pressed={relocation}
        onClick={() => update("relocation", relocation ? "" : "yes")}
        className="w-full sm:w-auto"
      >
        ✈️ Relocation
      </Button>

      <Select
        value={params.get("sort") ?? "date_posted"}
        onValueChange={(v) => update("sort", v)}
      >
        <SelectTrigger className="w-full sm:w-[150px]" aria-label="Sort jobs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORTS.map((s) => (
            <SelectItem key={s.value} value={s.value}>Sort: {s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
