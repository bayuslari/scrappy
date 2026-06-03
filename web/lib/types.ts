export type SponsorLikelihood = "likely" | "weak" | "unknown" | "no";
export type JobStatus =
  | "new"
  | "interested"
  | "applied"
  | "rejected"
  | "skip";

export interface Job {
  id: string;
  source: string;
  external_id: string;
  title: string;
  company: string | null;
  location: string | null;
  country: string | null;
  description: string | null;
  url: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  tech_score: number;
  tech_hits: string | null;
  sponsorship_likelihood: SponsorLikelihood;
  date_posted: string | null;
  date_scraped: string;
  status: JobStatus;
  notes: string | null;
}

export const STATUSES: JobStatus[] = [
  "new",
  "interested",
  "applied",
  "rejected",
  "skip",
];

export const SPONSORSHIPS: SponsorLikelihood[] = [
  "likely",
  "weak",
  "unknown",
  "no",
];
