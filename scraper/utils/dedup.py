"""Normalization + in-run deduplication helpers.

The Supabase unique constraint on (source, external_id) handles cross-run
dedup; this module dedups within a single run and applies scoring so every
row matches the `jobs` table shape before upsert.
"""

from utils.scoring import score_text


def _str(v) -> str:
    """Safely coerce any value (None, pandas NaN, numbers) to a clean string."""
    if v is None:
        return ""
    if isinstance(v, float) and v != v:  # NaN
        return ""
    return str(v).strip()


def _num(v):
    """Coerce a value to int, treating None/NaN/invalid as None."""
    if v is None or (isinstance(v, float) and v != v):  # None / NaN
        return None
    try:
        return int(float(v))
    except (ValueError, TypeError):
        return None

# Columns we actually send to Supabase (must exist in the jobs table).
_ALLOWED = {
    "source", "external_id", "title", "company", "location", "country",
    "description", "url", "salary_min", "salary_max", "salary_currency",
    "tech_score", "tech_hits", "sponsorship_likelihood", "date_posted",
}


# Text columns that must be clean strings (never NaN) before hitting Supabase —
# NaN is not JSON-serializable and would fail the upsert.
_TEXT_FIELDS = {
    "source", "external_id", "title", "company", "location", "country",
    "description", "url", "salary_currency",
}


def enrich(job: dict) -> dict:
    """Add scoring fields, sanitize text values, and trim to the DB schema."""
    text = f"{_str(job.get('description'))} {_str(job.get('title'))}"
    scored = {**job, **score_text(text)}

    # Coerce every text column to a clean string (NaN/None → "").
    for field in _TEXT_FIELDS:
        if field in scored:
            scored[field] = _str(scored[field])

    # Coerce numeric columns; NaN → None so the JSON upsert stays valid.
    for field in ("salary_min", "salary_max"):
        scored[field] = _num(scored.get(field))

    # Keep description bounded — some sources return huge HTML blobs.
    if scored.get("description"):
        scored["description"] = scored["description"][:8000]

    return {k: v for k, v in scored.items() if k in _ALLOWED}


def dedup_and_enrich(jobs: list[dict]) -> list[dict]:
    """Dedup a list of raw job dicts within this run, then enrich each.

    Dedup key precedence: (source, external_id) → url → (title, company).
    """
    seen = set()
    out = []
    for job in jobs:
        src = _str(job.get("source"))
        ext = _str(job.get("external_id"))
        url = _str(job.get("url"))
        title = _str(job.get("title")).lower()
        company = _str(job.get("company")).lower()

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
