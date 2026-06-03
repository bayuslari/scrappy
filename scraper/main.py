#!/usr/bin/env python3
"""Job Scraper Dashboard — entry point.

Runs all sources (Adzuna + Indeed/LinkedIn via JobSpy + custom SEEK) across the
configured countries, scores each job for tech fit and sponsorship likelihood,
deduplicates, and upserts into Supabase.

Usage:
    python main.py

Environment (see .env.example):
    SUPABASE_URL, SUPABASE_SERVICE_KEY     (required to upload)
    ADZUNA_APP_ID, ADZUNA_APP_KEY          (optional — Adzuna skipped if unset)
"""

import sys
import logging
from collections import Counter

# Load .env if present (no-op in CI where vars come from the environment).
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from config import SEARCH_QUERIES, COUNTRIES
from sources.adzuna import scrape_adzuna, is_configured as adzuna_configured
from sources.jobspy_scraper import scrape_jobspy, scrape_seek
from utils.dedup import dedup_and_enrich
from utils.supabase_client import get_client, upsert_jobs

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("scraper")


def collect() -> list[dict]:
    """Run every source across every configured country."""
    raw: list[dict] = []

    if not adzuna_configured():
        log.info("Adzuna not configured (no API key) — using JobSpy + SEEK only.")

    for code, cfg in COUNTRIES.items():
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


def main() -> int:
    print("\n🚀  Job Scraper Dashboard — collecting...\n")

    raw = collect()
    log.info(f"Total raw rows: {len(raw)}")

    jobs = dedup_and_enrich(raw)
    log.info(f"After dedup + scoring: {len(jobs)}")

    if not jobs:
        log.error("No jobs collected. Check connectivity / API limits.")
        return 1

    # Summary by sponsorship likelihood.
    by_sponsor = Counter(j["sponsorship_likelihood"] for j in jobs)
    print("\n" + "=" * 50)
    for label in ("likely", "weak", "unknown", "no"):
        print(f"  {label:<10}: {by_sponsor.get(label, 0)}")
    print("=" * 50 + "\n")

    client = get_client()
    if client is None:
        log.warning("Supabase not configured — printing top picks instead of uploading.")
        for j in sorted(jobs, key=lambda x: x["tech_score"], reverse=True)[:10]:
            print(f"  [{j['sponsorship_likelihood']}] {j['title']} @ {j['company']} "
                  f"(tech {j['tech_score']}) — {j['url']}")
        return 0

    n = upsert_jobs(client, jobs)
    log.info(f"✅  Upserted {n} jobs to Supabase (existing rows preserved).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
