// Tech-fit badge. Colour scales with the score so high-fit jobs pop visually.
function styleFor(score: number): string {
  if (score >= 6) return "bg-emerald-500 text-white";
  if (score >= 4) return "bg-lime-500 text-white";
  if (score >= 2) return "bg-amber-500 text-white";
  return "bg-slate-400 text-white dark:bg-slate-600";
}

export default function TechBadge({ score }: { score: number }) {
  const s = Number.isFinite(score) ? score : 0;
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm ${styleFor(s)}`}
    >
      <span className="sr-only">Tech fit: </span>
      tech {s}/10
    </span>
  );
}
