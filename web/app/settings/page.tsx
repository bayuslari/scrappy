import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = createClient();

  // Read the current skills (may be empty if the table isn't created yet).
  const { data } = await supabase
    .from("app_settings")
    .select("skills")
    .eq("id", 1)
    .maybeSingle();

  const skills = (data?.skills as string | undefined) ?? "";

  return (
    <main id="main" className="mx-auto max-w-2xl px-4 py-6">
      <Link
        href="/dashboard"
        className="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      >
        ← Back to jobs
      </Link>

      <h1 className="mt-3 text-2xl font-semibold">Settings</h1>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        Tune how jobs are scored for your profile.
      </p>

      <SettingsForm initialSkills={skills} />
    </main>
  );
}
