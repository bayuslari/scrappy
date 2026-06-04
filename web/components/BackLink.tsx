"use client";

import { useRouter } from "next/navigation";

// Goes back to the previous page (the dashboard with its filters/scroll intact)
// via browser history, falling back to /dashboard on a cold load.
export default function BackLink() {
  const router = useRouter();

  function back() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <button
      type="button"
      onClick={back}
      className="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
    >
      ← Back to jobs
    </button>
  );
}
