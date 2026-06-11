#!/usr/bin/env python3
"""Job Scraper Dashboard — entry point.

Runs all sources (Adzuna + Indeed/LinkedIn via JobSpy + custom SEEK + remote
boards) across the configured countries, scores each job for tech fit and
sponsorship likelihood, deduplicates, and upserts into Supabase.

To stay resilient to the workflow time limit, results are uploaded **per
country** as they finish — so a slow/cancelled run still keeps everything
gathered up to that point instead of losing the whole batch.

Usage:
    python main.py

Environment (see .env.example):
    SUPABASE_URL, SUPABASE_SERVICE_KEY     (required to upload)
    ADZUNA_APP_ID, ADZUNA_APP_KEY          (optional — Adzuna skipped if unset)
"""

import os
import sys
import logging
from collections import Counter

# Load .env if present (no-op in CI where vars come from the environment).
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from config import SEARCH_QUERIES, COUNTRIES, REMOTE_BOARDS
from sources.adzuna import scrape_adzuna, is_configured as adzuna_configured
from sources.jobspy_scraper import scrape_jobspy, scrape_seek
from sources.remoteok import scrape_remoteok
from sources.remotive import scrape_remotive
from sources.himalayas import scrape_himalayas
from utils.dedup import dedup_and_enrich
from utils.supabase_client import get_client, upsert_jobs, get_skills

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("scraper")


def collect_country(code: str, cfg: dict) -> list[dict]:
    """Run every source for a single country."""
    raw: list[dict] = []
    log.info(f"🌏  Country: {code}")
    for query in SEARCH_QUERIES:
        log.info(f"🔍  '{query}'")

        # Adzuna (one call covers the whole country).
        raw += scrape_adzuna(
            query=query,
            adzuna_code=cfg["adzuna_code"],
            country=code,
            currency=cfg["currency"],
        )

        # JobSpy (Indeed/LinkedIn) per location.
        for loc in cfg["locations"]:
            raw += scrape_jobspy(
                query=query,
                location=loc,
                country=code,
                jobspy_country=cfg["jobspy_country"],
            )

        # SEEK (AU only).
        if cfg.get("seek"):
            raw += scrape_seek(query=query, location="Adelaide SA", country=code)

    return raw


def collect_remote_boards() -> list[dict]:
    """Global remote boards (run once, not per country/query)."""
    raw: list[dict] = []
    log.info("🌐  Remote boards (RemoteOK + Remotive + Himalayas)")
    raw += scrape_remoteok()
    raw += scrape_remotive()
    raw += scrape_himalayas()
    return raw


def main() -> int:
    print("\n🚀  Job Scraper Dashboard — collecting...\n")

    # Create the client up front so we can read the user's skills profile and
    # use it to boost tech scoring, and upload incrementally.
    client = get_client()

    # Fail loudly if Supabase is configured but the client couldn't be built.
    if client is None and os.environ.get("SUPABASE_URL"):
        log.error("Supabase is configured but the client could not be created "
                  "— see the errors above (check your SUPABASE_URL secret).")
        return 1

    extra_skills = get_skills(client)
    if extra_skills:
        log.info(f"Boosting tech score with {len(extra_skills)} profile skill(s).")

    if not adzuna_configured():
        log.info("Adzuna not configured (no API key) — using JobSpy + SEEK only.")

    # Each batch: (label, raw rows). Process + upload one at a time.
    batches = [(code, lambda c=code, cfg=cfg: collect_country(c, cfg))
               for code, cfg in COUNTRIES.items()]
    if REMOTE_BOARDS:
        batches.append(("remote", collect_remote_boards))

    total_uploaded = 0
    sponsor_totals: Counter = Counter()

    for label, gather in batches:
        raw = gather()
        jobs = dedup_and_enrich(raw, extra_skills=extra_skills)
        if not jobs:
            log.info(f"   ({label}) no jobs after dedup — skipping upload.")
            continue

        sponsor_totals.update(j["sponsorship_likelihood"] for j in jobs)

        if client is None:
            # No Supabase: just surface a few top picks per batch.
            for j in sorted(jobs, key=lambda x: x["tech_score"], reverse=True)[:5]:
                print(f"  [{j['sponsorship_likelihood']}] {j['title']} @ {j['company']} "
                      f"(tech {j['tech_score']}) — {j['url']}")
            continue

        n = upsert_jobs(client, jobs)
        total_uploaded += n
        log.info(f"   ({label}) ✅ upserted {n} jobs (running total: {total_uploaded})")

    # Summary by sponsorship likelihood.
    print("\n" + "=" * 50)
    for lbl in ("likely", "weak", "unknown", "no"):
        print(f"  {lbl:<10}: {sponsor_totals.get(lbl, 0)}")
    print("=" * 50 + "\n")

    if client is None:
        log.warning("Supabase not configured — printed top picks instead of uploading.")
        return 0

    if total_uploaded == 0:
        log.error("No jobs uploaded. Check connectivity / API limits.")
        return 1

    log.info(f"✅  Done — upserted {total_uploaded} jobs to Supabase (existing rows preserved).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
