"""Himalayas source — free public JSON API, no key required.

Endpoint: GET https://himalayas.app/jobs/api
Returns { "jobs": [ { title, companyName, description (HTML), pubDate (unix),
applicationLink, guid, categories, locationRestrictions, minSalary, maxSalary,
salaryCurrency, ... }, ... ] }.

All listings are remote, so country=None and location is tagged remote. We strip
HTML from the description and keep only frontend/fullstack-relevant roles.
Graceful: any error returns [] so the scraper continues with other sources.
"""

import logging
from datetime import datetime, timezone

import requests
from bs4 import BeautifulSoup

from config import RELEVANT_KEYWORDS

log = logging.getLogger("scraper.himalayas")

URL = "https://himalayas.app/jobs/api"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    ),
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
}


def _relevant(title: str, cats: list) -> bool:
    hay = (title + " " + " ".join(str(c) for c in cats)).lower()
    return any(k in hay for k in RELEVANT_KEYWORDS)


def _strip_html(html: str) -> str:
    if not html:
        return ""
    try:
        return BeautifulSoup(html, "html.parser").get_text(" ", strip=True)
    except Exception:  # noqa: BLE001
        return str(html)


def _date_from(pub) -> str | None:
    """Himalayas pubDate is a unix timestamp (seconds or ms)."""
    try:
        ts = int(pub)
    except (TypeError, ValueError):
        return None
    if ts > 1_000_000_000_000:  # milliseconds
        ts //= 1000
    try:
        return datetime.fromtimestamp(ts, tz=timezone.utc).date().isoformat()
    except (OverflowError, OSError, ValueError):
        return None


def scrape_himalayas() -> list[dict]:
    """Fetch recent remote jobs from Himalayas, filtered to relevant roles."""
    try:
        resp = requests.get(URL, headers=HEADERS, timeout=20)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:  # noqa: BLE001
        log.warning(f"   ↳ Himalayas error: {e}")
        return []

    jobs = data.get("jobs", []) if isinstance(data, dict) else data
    rows = []
    for j in jobs:
        if not isinstance(j, dict):
            continue
        title = j.get("title") or ""
        cats = j.get("categories") or []
        if not title or not _relevant(title, cats):
            continue

        ext = str(j.get("guid") or j.get("id") or j.get("applicationLink") or "")
        if not ext:
            continue

        locs = j.get("locationRestrictions") or []
        loc_txt = ", ".join(str(x) for x in locs if x) if isinstance(locs, list) else str(locs)
        location = f"Remote · {loc_txt}" if loc_txt else "Remote"

        desc = _strip_html(j.get("description") or j.get("excerpt") or "")
        if cats:
            desc = f"{desc}\n\nTags: {', '.join(str(c) for c in cats)}"

        rows.append({
            "source": "himalayas",
            "external_id": ext,
            "title": title,
            "company": j.get("companyName") or j.get("company") or "",
            "location": location,
            "country": None,            # global remote
            "description": desc,
            "url": j.get("applicationLink") or j.get("url") or "",
            "salary_min": _to_int(j.get("minSalary")),
            "salary_max": _to_int(j.get("maxSalary")),
            "salary_currency": j.get("salaryCurrency") or "USD",
            "date_posted": _date_from(j.get("pubDate")),
        })

    log.info(f"   ↳ Himalayas: {len(rows)} jobs")
    return rows


def _to_int(v):
    try:
        if v is None:
            return None
        n = int(float(v))
        return n if n > 0 else None
    except (ValueError, TypeError):
        return None
