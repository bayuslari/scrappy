"""Scoring logic — ported from dama_adelaide_job_scraper.py `_score_text`.

Computes:
  - sponsorship_likelihood : likely | weak | unknown | no
  - tech_score             : 0..10 (capped) count of tech keyword matches
  - tech_hits              : matched keywords (comma separated)
"""

import re

# ── Sponsorship signal keywords ───────────────────────────────────────────────
# Positive — employer explicitly open to sponsorship / migration.
SPONSOR_POS = [
    r"visa sponsor",
    r"sponsorship available",
    r"sponsorship provided",
    r"\bsponsorship\b",
    r"DAMA",
    r"skilled migration",
    r"\b482\b",
    r"TSS visa",
    r"employer.?sponsored",
    r"relocation (assistance|support|package)",
    r"open to relocation",
    r"will sponsor",
    r"willing to sponsor",
]

# Weak — work-rights mentioned (could go either way).
SPONSOR_WEAK = [
    r"work rights",
    r"right to work",
    r"relocation",
]

# Negative — employer explicitly excludes overseas applicants.
SPONSOR_NEG = [
    r"must be (an )?australian citizen",
    r"australian (citizens?|residents?) only",
    r"permanent residents? only",
    r"no sponsorship",
    r"must have full.?working rights",
    r"must hold (a )?permanent",
    r"clearance required",
    r"security clearance",
    r"nv1|nv2|baseline clearance",
    r"australian citizenship (is )?required",
]

# ── Tech stack — matched to Bayu's CV (higher score = better fit) ──────────────
TECH_KEYWORDS = [
    "react", "next.js", "nextjs", "typescript", "tailwind", "tailwindcss",
    "javascript", "supabase", "graphql", "rest api",
    "vercel", "aws", "shadcn", "framer", "zustand", "prismic",
    "shopify", "headless", "cms",
    "cypress", "jest",
    "react native", "postgresql", "node.js", "nodejs",
]

TECH_SCORE_CAP = 10

# Map internal labels to the DB enum.
_LABELS = {
    "likely": "likely",
    "weak": "weak",
    "unknown": "unknown",
    "no": "no",
}


def score_text(text: str, extra_skills: list[str] | None = None) -> dict:
    """Score a job's text for sponsorship likelihood and tech fit.

    Sponsor labels:
      likely  — explicit strong signals (482, TSS, sponsorship, DAMA, ...)
      weak    — only soft signals (work rights / relocation mentioned)
      unknown — no mention either way
      no      — explicit exclusion (citizen only, security clearance, ...)

    `extra_skills` (from the user's profile in app_settings) are matched on top
    of the built-in TECH_KEYWORDS so jobs mentioning the user's own skills rank
    higher. Matches are de-duplicated case-insensitively and the score stays
    capped at TECH_SCORE_CAP.
    """
    t = (text or "").lower()

    pos_hits = [kw for kw in SPONSOR_POS if re.search(kw, t, re.I)]
    weak_hits = [kw for kw in SPONSOR_WEAK if re.search(kw, t, re.I)]
    neg_hits = [kw for kw in SPONSOR_NEG if re.search(kw, t, re.I)]

    hits: list[str] = []
    seen: set[str] = set()
    for kw in TECH_KEYWORDS + [s for s in (extra_skills or []) if s]:
        low = kw.lower()
        if low in seen:
            continue
        if low in t:
            hits.append(kw)
            seen.add(low)

    if neg_hits:
        label = _LABELS["no"]
    elif pos_hits:
        label = _LABELS["likely"]
    elif weak_hits:
        label = _LABELS["weak"]
    else:
        label = _LABELS["unknown"]

    return {
        "sponsorship_likelihood": label,
        "tech_hits": ", ".join(hits),
        "tech_score": min(len(hits), TECH_SCORE_CAP),
    }
