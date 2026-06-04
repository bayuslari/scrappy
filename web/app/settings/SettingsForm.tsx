"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

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
    <Card>
      <CardContent className="p-5">
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

        <Textarea
          id="skills"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          rows={6}
          placeholder="react, next.js, typescript, tailwind, supabase, graphql…"
          className="mt-3"
        />

        <div className="mt-3 flex items-center gap-3" aria-live="polite">
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save skills"}
          </Button>
          {saved && (
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
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
