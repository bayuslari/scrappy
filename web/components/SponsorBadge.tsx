import type { SponsorLikelihood } from "@/lib/types";

const STYLES: Record<SponsorLikelihood, string> = {
  likely: "bg-emerald-100 text-emerald-800",
  weak: "bg-orange-100 text-orange-800",
  unknown: "bg-yellow-100 text-yellow-800",
  no: "bg-red-100 text-red-700",
};

const LABELS: Record<SponsorLikelihood, string> = {
  likely: "✅ Likely",
  weak: "⚠️ Weak",
  unknown: "🔶 Unknown",
  no: "❌ No",
};

export default function SponsorBadge({ value }: { value: SponsorLikelihood }) {
  const v = STYLES[value] ? value : "unknown";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[v]}`}
    >
      {LABELS[v]}
    </span>
  );
}
