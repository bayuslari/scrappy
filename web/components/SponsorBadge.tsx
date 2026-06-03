import type { SponsorLikelihood } from "@/lib/types";

const STYLES: Record<SponsorLikelihood, string> = {
  likely:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  weak: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  unknown:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  no: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
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
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[v]}`}
    >
      <span aria-hidden="true">{ICONS[v]}</span>
      <span>
        <span className="sr-only">Sponsorship: </span>
        {LABELS[v]}
      </span>
    </span>
  );
}
