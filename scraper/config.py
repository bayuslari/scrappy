"""Central configuration for the job scraper.

Tweak search queries, target countries/locations, and limits here.
Customised for Bayu Riyadi — Senior Frontend Developer (React/Next.js/TS).
"""

# ── Search queries — broad enough to catch mid/senior roles alike ─────────────
SEARCH_QUERIES = [
    "Frontend Developer React",
    "React Developer",
    "Frontend Engineer Next.js",
    "Frontend Engineer TypeScript",
    "Next.js developer",
    "JavaScript developer",
    "React TypeScript developer",
    "Headless CMS developer React",
    "Shopify developer React",
    "Full stack developer Next.js",
]

# ── Target markets ────────────────────────────────────────────────────────────
# Each country drives JobSpy (Indeed/LinkedIn) + Adzuna where supported.
#   - jobspy_country : value passed to jobspy `country_indeed`
#   - adzuna_code    : Adzuna country path segment (None → Adzuna unsupported)
#   - seek           : whether to also run the custom SEEK scraper (AU only)
#   - currency       : default salary currency for the market
#   - locations      : list of location strings to search within the country
COUNTRIES = {
    "AU": {
        "jobspy_country": "Australia",
        "adzuna_code": "au",
        "seek": True,
        "currency": "AUD",
        "locations": ["Adelaide, SA", "Remote, Australia"],
    },
    "NZ": {
        "jobspy_country": "New Zealand",
        "adzuna_code": "nz",
        "seek": False,
        "currency": "NZD",
        "locations": ["Auckland", "Wellington"],
    },
    "UK": {
        "jobspy_country": "UK",
        "adzuna_code": "gb",
        "seek": False,
        "currency": "GBP",
        "locations": ["London", "Remote, UK"],
    },
}

# ── Limits / politeness ───────────────────────────────────────────────────────
RESULTS_EACH = 25       # results per query per site (keep modest to avoid blocks)
MAX_AGE_DAYS = 30       # only jobs posted within this many days
DELAY_BETWEEN = 3       # seconds between requests
ADZUNA_PAGES = 2        # Adzuna result pages per query (50 results/page)

# ── Global remote boards (RemoteOK, Remotive) ─────────────────────────────────
# These return all-remote jobs across every tag, so we filter to roles relevant
# to a frontend/fullstack search before keeping them.
REMOTE_BOARDS = True    # set False to skip RemoteOK + Remotive
RELEVANT_KEYWORDS = [
    "frontend", "front end", "front-end", "react", "next.js", "nextjs",
    "typescript", "javascript", "vue", "fullstack", "full stack", "full-stack",
    "web developer", "web engineer", "ui engineer", "shopify",
]
