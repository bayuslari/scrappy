import type { SponsorLikelihood } from "@/lib/types";

const STYLES: Record<SponsorLikelihood, string> = {
  likely: "bg-emerald-500 text-white",
  weak: "bg-amber-500 text-white",
  unknown: "bg-slate-400 text-white dark:bg-slate-500",
  no: "bg-red-500 text-white",
};

const LABELS: Record<SponsorLikelihood, string> = {
  likely: "Likely",
  weak: "Weak",
  unknown: "Unknown",
  no: "No",
};

const ICONS: Record<SponsorLikelihood, string> = {
  likely: "✅",
  weak: "⚠️",
  unknown: "🔶",
  no: "❌",
};

export default function SponsorBadge({ value }: { value: SponsorLikelihood }) {
  const v = STYLES[value] ? value : "unknown";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm ${STYLES[v]}`}
    >
      <span aria-hidden="true">{ICONS[v]}</span>
      <span>
        <span className="sr-only">Sponsorship: </span>
        {LABELS[v]}
      </span>
    </span>
  );
}
