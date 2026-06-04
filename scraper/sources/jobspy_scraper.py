"""Indeed + LinkedIn (via python-jobspy) and a custom SEEK scraper.

Ported from dama_adelaide_job_scraper.py. Returns lists of normalized job
dicts (see normalize() in utils.dedup) — actually returns raw dicts here and
main.py normalizes, to keep this module focused on fetching.
"""

import json
import time
import logging

import requests

from config import RESULTS_EACH, MAX_AGE_DAYS, DELAY_BETWEEN

log = logging.getLogger("scraper.jobspy")

# jobspy sites we can drive directly. SEEK is handled separately below.
JOBSPY_SITES = ["indeed", "linkedin"]


def scrape_jobspy(query: str, location: str, country: str, jobspy_country: str) -> list[dict]:
    """Scrape Indeed + LinkedIn for one query/location via python-jobspy."""
    try:
        from jobspy import scrape_jobs
    except ImportError:
        log.warning("python-jobspy not installed — skipping Indeed/LinkedIn")
        return []

    try:
        df = scrape_jobs(
            site_name=JOBSPY_SITES,
            search_term=query,
            location=location,
            results_wanted=RESULTS_EACH,
            hours_old=MAX_AGE_DAYS * 24,
            country_indeed=jobspy_country,
            linkedin_fetch_description=True,
            delay=DELAY_BETWEEN,
        )
    except Exception as e:  # noqa: BLE001 — jobspy raises a wide variety
        log.warning(f"   ↳ Indeed/LinkedIn error for '{query}' @ {location}: {e}")
        return []

    if df is None or df.empty:
        return []

    rows = []
    for _, r in df.iterrows():
        site = _clean_str(r.get("site")).lower() or "indeed"
        url = _clean_str(r.get("job_url")) or _clean_str(r.get("job_url_direct"))
        ext = _clean_str(r.get("id")) or url
        rows.append({
            "source": site,
            "external_id": ext,
            "title": _clean_str(r.get("title")),
            "company": _clean_str(r.get("company")),
            "location": _clean_str(r.get("location")) or location,
            "country": country,
            "description": _clean_str(r.get("description")),
            "url": url,
            "salary_min": _to_int(r.get("min_amount")),
            "salary_max": _to_int(r.get("max_amount")),
            "salary_currency": r.get("currency") or None,
            "date_posted": _to_date(r.get("date_posted")),
        })
    log.info(f"   ↳ Indeed/LinkedIn: {len(rows)} jobs")
    return rows


def scrape_seek(query: str, location: str = "Adelaide SA", country: str = "AU",
                max_pages: int = 3) -> list[dict]:
    """Custom SEEK scraper — jobspy doesn't support SEEK natively.

    Parses the __NEXT_DATA__ JSON embedded in SEEK's Next.js search pages.
    SEEK owns Jobstreet Australia, so this covers both platforms.
    """
    try:
        from bs4 import BeautifulSoup
    except ImportError:
        log.warning("   ↳ SEEK skipped — install beautifulsoup4")
        return []

    SEEK_SEARCH = "https://www.seek.com.au/jobs"
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-AU,en;q=0.9",
    }

    rows = []
    seen = set()

    for page in range(1, max_pages + 1):
        params = {
            "keywords": query,
            "where": location,
            "dateRange": f"{MAX_AGE_DAYS}d",
            "page": page,
        }
        try:
            resp = requests.get(SEEK_SEARCH, headers=headers, params=params,
                                timeout=20, allow_redirects=True)
            resp.raise_for_status()
        except Exception as e:  # noqa: BLE001
            log.warning(f"   ↳ SEEK page {page} fetch error: {e}")
            break

        soup = BeautifulSoup(resp.text, "html.parser")
        nd_tag = soup.find("script", id="__NEXT_DATA__")
        if not nd_tag:
            log.warning(f"   ↳ SEEK page {page}: __NEXT_DATA__ not found")
            break
        try:
            nd = json.loads(nd_tag.string or "{}")
        except json.JSONDecodeError:
            log.warning(f"   ↳ SEEK page {page}: could not parse __NEXT_DATA__")
            break

        page_props = nd.get("props", {}).get("pageProps", {})
        jobs = (
            page_props.get("jobsResult", {}).get("data")
            or page_props.get("results", {}).get("data")
            or page_props.get("jobs", {}).get("data")
            or page_props.get("jobListings")
            or []
        )
        if not jobs:
            break

        for job in jobs:
            jid = str(job.get("id", "") or job.get("jobId", ""))
            if not jid or jid in seen:
                continue
            seen.add(jid)

            advertiser = job.get("advertiser") or job.get("companyMeta") or {}
            rows.append({
                "source": "seek",
                "external_id": jid,
                "title": job.get("title", "") or "",
                "company": advertiser.get("description", "") or advertiser.get("name", "") or "",
                "location": job.get("suburb", "") or job.get("area", "") or location,
                "country": country,
                "description": job.get("teaser", "") or job.get("abstract", "") or "",
                "url": f"https://www.seek.com.au/job/{jid}",
                "salary_min": None,
                "salary_max": None,
                "salary_currency": None,
                "date_posted": (job.get("listingDate", "") or "")[:10] or None,
            })

        time.sleep(DELAY_BETWEEN)

    log.info(f"   ↳ SEEK: {len(rows)} jobs")
    return rows


def _clean_str(v) -> str:
    """Coerce a value to a clean string, treating pandas NaN/None as empty.

    JobSpy returns a DataFrame where missing cells are float('nan'), which is
    truthy — so `value or ""` does NOT clear it. This handles that safely.
    """
    if v is None:
        return ""
    if isinstance(v, float) and v != v:  # NaN
        return ""
    return str(v).strip()


def _to_int(v):
    try:
        if v is None or (isinstance(v, float) and v != v):  # None / NaN
            return None
        return int(float(v))
    except (ValueError, TypeError):
        return None


def _to_date(v):
    """Normalize various date representations to 'YYYY-MM-DD' or None."""
    if v is None or v == "" or (isinstance(v, float) and v != v):  # NaN guard
        return None
    s = str(v)[:10]
    return s or None
