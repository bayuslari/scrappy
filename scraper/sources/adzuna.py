"""Adzuna API source — official, free (250 req/day).

Docs: https://developer.adzuna.com/
Endpoint: GET /v1/api/jobs/{country}/search/{page}?app_id=..&app_key=..&what=..

Gracefully returns [] if ADZUNA_APP_ID / ADZUNA_APP_KEY are not configured,
so the scraper still runs on JobSpy + SEEK alone.
"""

import os
import time
import logging

import requests

from config import MAX_AGE_DAYS, ADZUNA_PAGES, DELAY_BETWEEN

log = logging.getLogger("scraper.adzuna")

BASE = "https://api.adzuna.com/v1/api/jobs"
RESULTS_PER_PAGE = 50  # Adzuna max


def is_configured() -> bool:
    return bool(os.environ.get("ADZUNA_APP_ID") and os.environ.get("ADZUNA_APP_KEY"))


def scrape_adzuna(query: str, adzuna_code: str, country: str,
                  currency: str | None = None, location: str | None = None) -> list[dict]:
    """Fetch jobs from Adzuna for one query in one country.

    `adzuna_code` is the Adzuna country segment, e.g. 'au', 'gb', 'nz'.
    """
    if not is_configured():
        return []
    if not adzuna_code:
        return []

    app_id = os.environ["ADZUNA_APP_ID"]
    app_key = os.environ["ADZUNA_APP_KEY"]

    rows = []
    for page in range(1, ADZUNA_PAGES + 1):
        params = {
            "app_id": app_id,
            "app_key": app_key,
            "what": query,
            "results_per_page": RESULTS_PER_PAGE,
            "max_days_old": MAX_AGE_DAYS,
            "content-type": "application/json",
        }
        if location:
            params["where"] = location
        try:
            resp = requests.get(f"{BASE}/{adzuna_code}/search/{page}",
                                params=params, timeout=20)
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:  # noqa: BLE001
            log.warning(f"   ↳ Adzuna error for '{query}' ({adzuna_code}) p{page}: {e}")
            break

        results = data.get("results", [])
        if not results:
            break

        for j in results:
            jid = str(j.get("id", ""))
            if not jid:
                continue
            company = (j.get("company") or {}).get("display_name", "")
            loc = (j.get("location") or {}).get("display_name", "") or location or ""
            rows.append({
                "source": "adzuna",
                "external_id": jid,
                "title": j.get("title", "") or "",
                "company": company,
                "location": loc,
                "country": country,
                "description": j.get("description", "") or "",
                "url": j.get("redirect_url", "") or "",
                "salary_min": _to_int(j.get("salary_min")),
                "salary_max": _to_int(j.get("salary_max")),
                "salary_currency": currency,
                "date_posted": (j.get("created", "") or "")[:10] or None,
            })

        time.sleep(DELAY_BETWEEN)

    log.info(f"   ↳ Adzuna ({adzuna_code}): {len(rows)} jobs")
    return rows


def _to_int(v):
    try:
        if v is None:
            return None
        return int(float(v))
    except (ValueError, TypeError):
        return None
