"use client";

import { useState } from "react";

export default function SettingsForm({ initialSkills }: { initialSkills: string }) {
  const [skills, setSkills] = useState(initialSkills);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setSaved(false);
    setError(null);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skills }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save");
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <label
        htmlFor="skills"
        className="block text-sm font-medium text-slate-700 dark:text-slate-200"
      >
        Your skills
      </label>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Comma or newline separated. Jobs mentioning these get a higher tech
        score on the next scrape (every 12h). Example:{" "}
        <span className="font-mono text-xs">react, next.js, typescript, graphql</span>
      </p>

      <textarea
        id="skills"
        value={skills}
        onChange={(e) => setSkills(e.target.value)}
        rows={6}
        placeholder="react, next.js, typescript, tailwind, supabase, graphql…"
        className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-400"
      />

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          {saving ? "Saving…" : "Save skills"}
        </button>
        {saved && (
          <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Saved ✓
          </span>
        )}
        {error && (
          <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
        )}
      </div>
    </div>
  );
}
