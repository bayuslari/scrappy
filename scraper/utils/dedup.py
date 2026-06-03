"""Normalization + in-run deduplication helpers.

The Supabase unique constraint on (source, external_id) handles cross-run
dedup; this module dedups within a single run and applies scoring so every
row matches the `jobs` table shape before upsert.
"""

from utils.scoring import score_text

# Columns we actually send to Supabase (must exist in the jobs table).
_ALLOWED = {
    "source", "external_id", "title", "company", "location", "country",
    "description", "url", "salary_min", "salary_max", "salary_currency",
    "tech_score", "tech_hits", "sponsorship_likelihood", "date_posted",
}


def enrich(job: dict) -> dict:
    """Add scoring fields and trim to the DB schema."""
    text = f"{job.get('description', '')} {job.get('title', '')}"
    scored = {**job, **score_text(text)}
    # Keep description bounded — some sources return huge HTML blobs.
    if scored.get("description"):
        scored["description"] = str(scored["description"])[:8000]
    return {k: v for k, v in scored.items() if k in _ALLOWED}


def dedup_and_enrich(jobs: list[dict]) -> list[dict]:
    """Dedup a list of raw job dicts within this run, then enrich each.

    Dedup key precedence: (source, external_id) → url → (title, company).
    """
    seen = set()
    out = []
    for job in jobs:
        src = job.get("source", "")
        ext = job.get("external_id", "")
        url = job.get("url", "")
        title = (job.get("title", "") or "").strip().lower()
        company = (job.get("company", "") or "").strip().lower()

        if src and ext:
            key = ("se", src, ext)
        elif url:
            key = ("url", url)
        else:
            key = ("tc", title, company)

        if not title or key in seen:
            continue
        seen.add(key)
        out.append(enrich(job))
    return out
