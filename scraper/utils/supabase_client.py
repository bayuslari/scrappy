"""Supabase service-role client + upsert helper.

Uses the SERVICE_ROLE key (bypasses RLS) so the scraper can write freely.
Never expose this key in the web app or commit it.
"""

import os
import logging

log = logging.getLogger("scraper.supabase")


def get_client():
    """Create a Supabase client from env vars, or None if not configured."""
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        log.error("SUPABASE_URL / SUPABASE_SERVICE_KEY not set — cannot upload.")
        return None
    try:
        from supabase import create_client
    except ImportError:
        log.error("supabase package not installed — run pip install supabase")
        return None
    return create_client(url, key)


def upsert_jobs(client, jobs: list[dict]) -> int:
    """Insert new jobs, ignoring ones that already exist.

    We use `ignore_duplicates=True` on the (source, external_id) unique
    constraint so existing rows — including any user-edited status/notes —
    are preserved and never overwritten. Returns count of attempted rows.
    """
    if not jobs:
        return 0

    inserted = 0
    # Batch to stay well under payload limits.
    for i in range(0, len(jobs), 200):
        batch = jobs[i:i + 200]
        try:
            (client.table("jobs")
                   .upsert(batch,
                           on_conflict="source,external_id",
                           ignore_duplicates=True)
                   .execute())
            inserted += len(batch)
        except Exception as e:  # noqa: BLE001
            log.warning(f"Upsert batch {i // 200} failed: {e}")
    return inserted
