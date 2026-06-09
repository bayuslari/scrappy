"""Scoring logic — ported from dama_adelaide_job_scraper.py `_score_text`.

Computes:
  - sponsorship_likelihood : likely | weak | unknown | no
  - tech_score             : 0..10 (capped) count of tech keyword matches
  - tech_hits              : matched keywords (comma separated)
"""

import re

# ── Sponsorship signal keywords ───────────────────────────────────────────────
# Positive — employer EXPLICITLY offers visa sponsorship / migration support.
# (Relocation assistance is NOT here — it's about moving, not visa rights.)
SPONSOR_POS = [
    r"visa sponsor",
    r"visa sponsorship",
    r"sponsorship (is )?(available|offered|provided|possible)",
    r"(will|willing to|can|able to|happy to|we) sponsor",
    r"sponsor (your |the )?visa",
    r"\bDAMA\b",
    r"skilled migration",
    r"\b482\b",
    r"TSS visa",
    r"employer.?sponsored",
]

# Weak — soft / ambiguous signals (mentioned, but not a clear offer).
SPONSOR_WEAK = [
    r"work rights",
    r"right to work",
    r"\brelocation\b",
    r"relocation (assistance|support|package)",
    r"open to relocation",
    r"\bsponsorship\b",   # the word appears but no explicit offer
]

# Negative — employer EXCLUDES overseas applicants / can't sponsor.
SPONSOR_NEG = [
    r"must be (an? )?(australian|uk|u\.k\.|british|us|u\.s\.|american|nz|new zealand) citizen",
    r"(australian|uk|u\.k\.|british|us|u\.s\.|american|nz|new zealand) citizen(ship)?\b.{0,15}(required|only|essential|mandatory|: ?yes)",
    r"citizenship required",
    r"citizens? only",
    r"must (be a citizen|hold .{0,25}citizenship)",
    r"permanent residents? only",
    r"no (visa )?sponsorship",
    r"sponsorship (is )?not (available|offered|provided)",
    r"(not able|unable|cannot|can'?t) to sponsor",
    r"(do(es)? not|won'?t) (offer|provide|consider) .{0,20}sponsor",
    r"without (the need for )?(visa )?sponsorship",
    r"must (already )?have (full |the )?(right to work|working rights)",
    r"must hold (a )?permanent",
    r"clearance required",
    r"security clearance",
    r"\bnv1\b|\bnv2\b|baseline clearance",
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
