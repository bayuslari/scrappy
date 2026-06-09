"""Supabase service-role client + upsert helper.

Uses the SERVICE_ROLE key (bypasses RLS) so the scraper can write freely.
Never expose this key in the web app or commit it.
"""

import os
import logging

log = logging.getLogger("scraper.supabase")


def get_client():
    """Create a Supabase client from env vars, or None if not configured.

    Cleans common copy-paste mistakes in the SUPABASE_URL secret (surrounding
    whitespace/newlines, a trailing slash) and validates the scheme so the
    failure mode is a clear log line instead of an opaque "Invalid URL".
    """
    url = (os.environ.get("SUPABASE_URL") or "").strip().rstrip("/")
    key = (os.environ.get("SUPABASE_SERVICE_KEY") or "").strip()

    if not url or not key:
        log.error("SUPABASE_URL / SUPABASE_SERVICE_KEY not set — cannot upload.")
        return None

    if not url.startswith("https://") or not url.endswith(".supabase.co"):
        log.error(
            "SUPABASE_URL looks invalid: %r. It must be exactly your project "
            "URL, e.g. https://xxxx.supabase.co (no trailing slash, no path).",
            url,
        )
        return None

    try:
        from supabase import create_client
    except ImportError:
        log.error("supabase package not installed — run pip install supabase")
        return None

    try:
        return create_client(url, key)
    except Exception as e:  # noqa: BLE001
        log.error("Failed to create Supabase client (%s). Check your secrets.", e)
        return None


def get_skills(client) -> list[str]:
    """Fetch the user's skills list from app_settings (id=1).

    Returns a clean list of skill strings (split on comma/newline). Returns an
    empty list if the table/row doesn't exist yet — scoring then falls back to
    the built-in TECH_KEYWORDS only. The service-role client bypasses RLS, so
    this read always works regardless of the owner-only policy.
    """
    if client is None:
        return []
    try:
        res = (client.table("app_settings")
                     .select("skills")
                     .eq("id", 1)
                     .limit(1)
                     .execute())
        rows = res.data or []
        raw = (rows[0].get("skills") if rows else "") or ""
    except Exception as e:  # noqa: BLE001 — table may not exist yet
        log.info("Could not read app_settings.skills (%s) — using defaults.", e)
        return []

    parts = [p.strip() for p in raw.replace("\n", ",").split(",")]
    return [p for p in parts if p]


def upsert_jobs(client, jobs: list[dict]) -> int:
    """Upsert jobs on the (source, external_id) unique constraint.

    The payload only ever contains scraper-computed columns (title, salary,
    tech_score, sponsorship_likelihood, ...) — never `status` or `notes`. So a
    normal upsert UPDATEs those computed columns for existing rows (healing old
    rows when scoring improves) while Postgres leaves `status`/`notes` — the
    user-edited fields not in the payload — untouched. Returns attempted rows.
    """
    if not jobs:
        return 0

    inserted = 0
    # Batch to stay well under payload limits.
    for i in range(0, len(jobs), 200):
        batch = jobs[i:i + 200]
        try:
            (client.table("jobs")
                   .upsert(batch, on_conflict="source,external_id")
                   .execute())
            inserted += len(batch)
        except Exception as e:  # noqa: BLE001
            log.warning(f"Upsert batch {i // 200} failed: {e}")
    return inserted
