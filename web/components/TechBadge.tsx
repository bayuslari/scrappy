import { Badge } from "@/components/ui/badge";

// Tech-fit badge. Colour scales with the score so high-fit jobs pop visually.
function variantFor(score: number) {
  if (score >= 6) return "emerald" as const;
  if (score >= 4) return "lime" as const;
  if (score >= 2) return "amber" as const;
  return "slate" as const;
}

export default function TechBadge({ score }: { score: number }) {
  const s = Number.isFinite(score) ? score : 0;
  return (
    <Badge variant={variantFor(s)}>
      <span className="sr-only">Tech fit: </span>
      tech {s}/10
    </Badge>
  );
}
