"""Remotive source — free public JSON API, no key required.

Endpoint: GET https://remotive.com/api/remote-jobs?category=software-dev
Returns { "jobs": [ {id, title, company_name, tags, candidate_required_location,
salary, description (HTML), url, publication_date}, ... ] }.

Remotive asks callers to be gentle (a few requests/day) — fine for a 12h cron.
All jobs are remote, so country=None and we tag location as remote.
"""

import logging

import requests

from config import RELEVANT_KEYWORDS

log = logging.getLogger("scraper.remotive")

URL = "https://remotive.com/api/remote-jobs"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    ),
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
}


def _relevant(title: str, tags: list[str]) -> bool:
    hay = (title + " " + " ".join(tags)).lower()
    return any(k in hay for k in RELEVANT_KEYWORDS)


def scrape_remotive(limit: int = 200) -> list[dict]:
    """Fetch recent remote software-dev jobs from Remotive, filtered to relevant roles."""
    try:
        resp = requests.get(
            URL,
            params={"category": "software-dev", "limit": limit},
            headers=HEADERS,
            timeout=20,
        )
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:  # noqa: BLE001
        log.warning(f"   ↳ Remotive error: {e}")
        return []

    rows = []
    for j in data.get("jobs", []):
        title = j.get("title") or ""
        tags = j.get("tags") or []
        if not title or not _relevant(title, tags):
            continue

        loc = (j.get("candidate_required_location") or "").strip()
        location = f"Remote · {loc}" if loc and "remote" not in loc.lower() else (loc or "Remote")

        desc = j.get("description") or ""
        if tags:
            desc = f"{desc}\n\nTags: {', '.join(tags)}"

        rows.append({
            "source": "remotive",
            "external_id": str(j.get("id")),
            "title": title,
            "company": j.get("company_name") or "",
            "location": location,
            "country": None,            # global remote
            "description": desc,
            "url": j.get("url") or "",
            "salary_min": None,         # Remotive salary is a free-text string
            "salary_max": None,
            "salary_currency": None,
            "date_posted": (j.get("publication_date") or "")[:10] or None,
        })

    log.info(f"   ↳ Remotive: {len(rows)} jobs")
    return rows
