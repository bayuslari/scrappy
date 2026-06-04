import type { SponsorLikelihood } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

const VARIANTS = {
  likely: "emerald",
  weak: "amber",
  unknown: "slate",
  no: "red",
} as const;

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
  const v = LABELS[value] ? value : "unknown";
  return (
    <Badge variant={VARIANTS[v]} className="gap-1">
      <span aria-hidden="true">{ICONS[v]}</span>
      <span>
        <span className="sr-only">Sponsorship: </span>
        {LABELS[v]}
      </span>
    </Badge>
  );
}
