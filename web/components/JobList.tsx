"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Job } from "@/lib/types";
import JobCard from "./JobCard";
import { PAGE_SIZE } from "@/lib/jobsQuery";

// Renders the job grid and lazy-loads more pages as the user scrolls down,
// so the initial paint stays light even with hundreds of results.
export default function JobList({
  initialJobs,
  query,
}: {
  initialJobs: Job[];
  query: string; // filter query string (no page param)
}) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [page, setPage] = useState(0);
  const [done, setDone] = useState(initialJobs.length < PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const sentinel = useRef<HTMLDivElement | null>(null);

  // Reset when the filters (and therefore the server's first page) change.
  useEffect(() => {
    setJobs(initialJobs);
    setPage(0);
    setDone(initialJobs.length < PAGE_SIZE);
  }, [initialJobs, query]);

  const loadMore = useCallback(async () => {
    if (loading || done) return;
    setLoading(true);
    const next = page + 1;
    try {
      const sep = query ? "&" : "";
      const res = await fetch(`/api/jobs?page=${next}${sep}${query}`);
      if (res.ok) {
        const { jobs: more, hasMore } = await res.json();
        setJobs((prev) => [...prev, ...(more as Job[])]);
        setPage(next);
        if (!hasMore) setDone(true);
      } else {
        setDone(true);
      }
    } catch {
      setDone(true);
    } finally {
      setLoading(false);
    }
  }, [loading, done, page, query]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "600px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  return (
    <>
      <div className="grid gap-3">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
      {!done && (
        <div
          ref={sentinel}
          className="py-6 text-center text-sm text-muted-foreground"
          aria-live="polite"
        >
          {loading ? "Loading more…" : ""}
        </div>
      )}
    </>
  );
}
