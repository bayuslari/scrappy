"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { STATUSES, type JobStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setSaved(false);
    setError(null);
    const res = await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, notes }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to save");
    }
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
          Status
        </label>
        <Select value={status} onValueChange={(v) => setStatus(v as JobStatus)}>
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
          Notes
        </label>
        <Textarea
          id="job-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          placeholder="Personal notes…"
          className="mt-1"
        />

        <div className="mt-3 flex items-center gap-3" aria-live="polite">
          <Button type="button" onClick={save} disabled={saving} size="sm">
            {saving ? "Saving…" : "Save"}
          </Button>
          {saved && (
            <span className="text-sm text-emerald-600 dark:text-emerald-400">
              Saved ✓
            </span>
          )}
          {error && (
            <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
