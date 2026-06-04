-- ============================================================================
-- Skills profile (Opsi A) — boost job scoring with your own CV skills
-- ----------------------------------------------------------------------------
-- Creates a single-row `app_settings` table holding a comma/newline separated
-- list of your skills. The web /settings page edits it; the scraper reads it
-- (service-role key bypasses RLS) and gives jobs that mention your skills a
-- higher tech_score.
--
-- 1. Replace 'you@example.com' below with your real login email.
-- 2. Run this in the Supabase SQL editor.
-- ============================================================================

create table if not exists public.app_settings (
    id          int  primary key default 1,
    skills      text default '',
    updated_at  timestamptz not null default now(),
    -- Enforce a single row.
    constraint app_settings_singleton check (id = 1)
);

-- Seed the singleton row.
insert into public.app_settings (id, skills)
values (1, '')
on conflict (id) do nothing;

-- Row Level Security — only the owner email can read/write via the web app.
-- (The scraper uses the service-role key, which bypasses RLS.)
alter table public.app_settings enable row level security;

drop policy if exists "owner only settings" on public.app_settings;
create policy "owner only settings"
    on public.app_settings
    for all
    to authenticated
    using ( (auth.jwt() ->> 'email') = 'you@example.com' )
    with check ( (auth.jwt() ->> 'email') = 'you@example.com' );
