"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { STATUSES, type JobStatus } from "@/lib/types";

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
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">
        Your tracking
      </h2>

      <label className="block text-xs font-medium text-slate-500">Status</label>
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as JobStatus)}
        className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm capitalize outline-none focus:border-slate-900"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s} className="capitalize">
            {s}
          </option>
        ))}
      </select>

      <label className="mt-3 block text-xs font-medium text-slate-500">
        Notes
      </label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={5}
        placeholder="Personal notes…"
        className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-slate-900"
      />

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {saved && <span className="text-sm text-emerald-600">Saved ✓</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  );
}
