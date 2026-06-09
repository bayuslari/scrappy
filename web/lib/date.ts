// Human-friendly "posted" label: Today / Yesterday / N days ago / Mon D.
// Pure + timezone-safe (compares calendar dates), usable on server or client.
export function formatPosted(input?: string | null): string | null {
  if (!input) return null;
  const [y, m, d] = input.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;

  const posted = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((today.getTime() - posted.getTime()) / 86_400_000);

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;
  return posted.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// True if the job was posted today (for a "new" highlight).
export function isToday(input?: string | null): boolean {
  return formatPosted(input) === "Today";
}
