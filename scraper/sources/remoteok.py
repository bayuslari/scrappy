"""RemoteOK source — free public JSON API, no key required.

Endpoint: GET https://remoteok.com/api  (requires a browser-like User-Agent)
The first array element is a legal/metadata notice and is skipped.

RemoteOK jobs are all remote, so we tag them as remote (country=None) and only
keep ones relevant to a frontend/fullstack search to avoid flooding the board.
"""

import logging

import requests

from config import RELEVANT_KEYWORDS

log = logging.getLogger("scraper.remoteok")

URL = "https://remoteok.com/api"
# RemoteOK sits behind Cloudflare and rejects non-browser User-Agents, so send a
# realistic browser header set. If it still 403s (e.g. restricted egress), the
# caller's try/except logs it and the scraper continues with other sources.
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


def scrape_remoteok() -> list[dict]:
    """Fetch recent remote jobs from RemoteOK, filtered to relevant roles."""
    try:
        resp = requests.get(URL, headers=HEADERS, timeout=20)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:  # noqa: BLE001
        log.warning(f"   ↳ RemoteOK error: {e}")
        return []

    rows = []
    for j in data:
        # Skip the leading metadata/legal element.
        if not isinstance(j, dict) or not j.get("id"):
            continue

        title = j.get("position") or j.get("title") or ""
        tags = j.get("tags") or []
        if not title or not _relevant(title, tags):
            continue

        loc = (j.get("location") or "").strip()
        location = f"Remote · {loc}" if loc and "remote" not in loc.lower() else (loc or "Remote")

        # Append tags so scoring can pick them up as tech keywords.
        desc = j.get("description") or ""
        if tags:
            desc = f"{desc}\n\nTags: {', '.join(tags)}"

        rows.append({
            "source": "remoteok",
            "external_id": str(j.get("id")),
            "title": title,
            "company": j.get("company") or "",
            "location": location,
            "country": None,            # global remote
            "description": desc,
            "url": j.get("url") or j.get("apply_url") or "",
            "salary_min": _to_int(j.get("salary_min")),
            "salary_max": _to_int(j.get("salary_max")),
            "salary_currency": "USD",
            "date_posted": (j.get("date") or "")[:10] or None,
        })

    log.info(f"   ↳ RemoteOK: {len(rows)} jobs")
    return rows


def _to_int(v):
    try:
        if v is None:
            return None
        n = int(float(v))
        return n if n > 0 else None
    except (ValueError, TypeError):
        return None
