"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { STATUSES, type JobStatus } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function JobEditor({
  id,
  initialStatus,
  initialNotes,
}: {
  id: string;
  initialStatus: JobStatus;
  initialNotes: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<JobStatus>(initialStatus);
  const [notes, setNotes] = useState(initialNotes);
  const [savedNotes, setSavedNotes] = useState(initialNotes);
  const [hint, setHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function patch(body: Record<string, unknown>, okMsg: string) {
    setError(null);
    setHint("Saving…");
    const res = await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setHint(okMsg);
      router.refresh();
      setTimeout(() => setHint(null), 2000);
    } else {
      const data = await res.json().catch(() => ({}));
      setHint(null);
      setError(data.error ?? "Failed to save");
    }
  }

  // Status auto-saves the moment it changes — no button needed.
  function onStatusChange(value: string) {
    const next = value as JobStatus;
    setStatus(next);
    patch({ status: next }, "Saved ✓");
  }

  // Notes auto-save on blur (only if changed).
  function onNotesBlur() {
    if (notes === savedNotes) return;
    setSavedNotes(notes);
    patch({ notes }, "Notes saved ✓");
  }

  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
          Your tracking
        </h2>

        <label
          htmlFor="job-status"
          className="block text-xs font-medium text-slate-500 dark:text-slate-400"
        >
          Status <span className="text-slate-400">(saves instantly)</span>
        </label>
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger id="job-status" className="mt-1 capitalize">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label
          htmlFor="job-notes"
          className="mt-3 block text-xs font-medium text-slate-500 dark:text-slate-400"
        >
          Notes <span className="text-slate-400">(saves when you click away)</span>
        </label>
        <Textarea
          id="job-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={onNotesBlur}
          rows={5}
          placeholder="Personal notes…"
          className="mt-1"
        />

        <div className="mt-2 h-5 text-sm" aria-live="polite">
          {hint && <span className="text-emerald-600 dark:text-emerald-400">{hint}</span>}
          {error && <span className="text-red-600 dark:text-red-400">{error}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
