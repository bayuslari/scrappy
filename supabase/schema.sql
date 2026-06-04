-- ============================================================================
-- Job Scraper Dashboard — Supabase schema
-- ----------------------------------------------------------------------------
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query → Run).
-- It creates the `jobs` table, indexes, and Row Level Security policies.
-- ============================================================================

-- Drop for clean re-runs during setup (comment out if you have real data).
-- drop table if exists public.jobs cascade;

create table if not exists public.jobs (
    id                      uuid primary key default gen_random_uuid(),
    source                  text not null,                       -- adzuna | indeed | linkedin | seek
    external_id             text not null,                       -- original job id from source (dedup)
    title                   text not null,
    company                 text,
    location                text,
    country                 text,                                -- AU | NZ | UK
    description             text,
    url                     text,
    salary_min              int4,
    salary_max              int4,
    salary_currency         text,                                -- AUD | NZD | GBP
    tech_score              int4 default 0,                      -- 0..10, computed by scraper
    tech_hits               text,                                -- matched keywords (comma separated)
    sponsorship_likelihood  text default 'unknown',              -- likely | weak | unknown | no
    date_posted             date,
    date_scraped            timestamptz not null default now(),
    status                  text not null default 'new',         -- new | interested | applied | rejected | skip
    notes                   text,

    -- Dedup: a job is unique per (source, external_id).
    constraint jobs_source_external_id_key unique (source, external_id)
);

-- A job URL should also be unique when present (guards cross-source dupes).
create unique index if not exists jobs_url_key
    on public.jobs (url)
    where url is not null;

-- Indexes for the dashboard's filter/sort surface.
create index if not exists jobs_country_idx                on public.jobs (country);
create index if not exists jobs_sponsorship_idx            on public.jobs (sponsorship_likelihood);
create index if not exists jobs_status_idx                 on public.jobs (status);
create index if not exists jobs_tech_score_idx             on public.jobs (tech_score desc);
create index if not exists jobs_date_posted_idx            on public.jobs (date_posted desc);

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
-- The web app uses the ANON key + a logged-in session → `authenticated` role.
-- The scraper uses the SERVICE_ROLE key, which bypasses RLS entirely.
--
-- IMPORTANT: magic-link sign-in lets ANYONE create an account for their own
-- email, so the policy is scoped to a single owner email. Replace
-- 'you@example.com' below with your real login email before running.
-- (To allow several people, use: in (lower(...)) with a list.)
-- ----------------------------------------------------------------------------
alter table public.jobs enable row level security;

drop policy if exists "authenticated full access" on public.jobs;
drop policy if exists "owner only" on public.jobs;
create policy "owner only"
    on public.jobs
    for all
    to authenticated
    using ( (auth.jwt() ->> 'email') = 'you@example.com' )
    with check ( (auth.jwt() ->> 'email') = 'you@example.com' );
