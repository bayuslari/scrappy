# Job Scraper Dashboard

Personal job-hunting tool. A Python scraper collects frontend/fullstack
developer jobs from multiple sources, scores them for **tech fit** and **visa
sponsorship likelihood**, and stores them in **Supabase**. A private **Next.js**
dashboard (on Vercel) lets you filter, sort, track status, and take notes.

**Total cost: $0/month** — all free tiers, no credit card needed.

```
Python scraper (GitHub Actions cron, every 12h)
  ├── Adzuna API (official, free — optional)
  ├── Indeed + LinkedIn (python-jobspy)
  ├── SEEK (custom scraper, AU)
  └── RemoteOK + Remotive (global remote boards, free public APIs)
        ↓
   Supabase (Postgres + Auth + RLS)
        ↓
   Next.js dashboard on Vercel (private, magic-link login)
```

---

## Repository layout

| Path | What |
|---|---|
| `supabase/schema.sql` | DB table + indexes + RLS policy |
| `scraper/` | Python scraper (sources, scoring, Supabase upsert) |
| `web/` | Next.js 14 dashboard |
| `.github/workflows/scraper.yml` | Cron automation (every 12h + manual) |
| `dama_adelaide_job_scraper.py` | Original single-file scraper (kept for reference) |

---

## Setup

### 1. Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** → paste the contents of `supabase/schema.sql` → **Run**.
3. **Project Settings → API**, note:
   - `Project URL` → `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY` (web app)
   - `service_role` key → `SUPABASE_SERVICE_KEY` (scraper only — keep secret)
4. **Authentication → Providers → Email**: enable, with magic link. Add your
   Vercel URL (and `http://localhost:3000`) under **URL Configuration →
   Redirect URLs**, e.g. `https://your-app.vercel.app/auth/callback`.
5. **Lock it down (important — it's a private tool):** magic-link lets anyone
   request a sign-in link for their *own* email, so you must restrict access:
   - **Authentication → Sign In / Providers → disable "Allow new users to sign
     up"** so strangers can't create accounts. Add your own user via
     **Authentication → Users → Add user**.
   - Run `supabase/restrict_to_owner.sql` (with your email) so RLS only lets
     *your* email read/write at the database level.
   - Set `ALLOWED_EMAILS` in Vercel (see web app step) as an app-level guard.

### 2. Scraper (local test)

```bash
cd scraper
pip install -r requirements.txt
cp .env.example .env          # fill SUPABASE_* (+ optional ADZUNA_*)
python main.py
```

Re-running is safe — jobs upsert on `(source, external_id)` and existing
`status`/`notes` are preserved. Adzuna is skipped automatically if no API key
is set ([register free](https://developer.adzuna.com/)).

### 3. GitHub Actions (automation)

Push this repo to GitHub, then add repo **Settings → Secrets and variables →
Actions**:

```
SUPABASE_URL
SUPABASE_SERVICE_KEY
ADZUNA_APP_ID      (optional)
ADZUNA_APP_KEY     (optional)
```

The workflow runs every 12 hours and can be triggered manually from the
**Actions** tab. These twice-daily writes also keep the Supabase free tier from
pausing.

### 4. Web app (Vercel)

```bash
cd web
npm install
cp .env.local.example .env.local   # fill NEXT_PUBLIC_SUPABASE_*
npm run dev                        # http://localhost:3000
```

Deploy to a free Vercel subdomain:

1. Import the repo at [vercel.com/new](https://vercel.com/new).
2. Set **Root Directory = `web`**.
3. Add env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ALLOWED_EMAILS` — comma-separated emails allowed to log in (e.g. just
     yours). Bounces anyone else to the login page even if they authenticate.
4. Deploy. The dashboard reads **live** from Supabase, so every scrape run
   appears automatically — no redeploy needed.

> After changing env vars, **redeploy** (env is baked at build time).

---

## Configuration

Edit `scraper/config.py` to change search queries, target countries
(`AU` / `NZ` / `UK`), locations, and limits. Scoring keywords (tech stack +
sponsorship signals) live in `scraper/utils/scoring.py`.
