-- ============================================================================
-- Lock the dashboard to a single owner (defense in depth)
-- ----------------------------------------------------------------------------
-- The original policy allowed ANY authenticated user to read/write jobs. Since
-- magic-link sign-in lets anyone create an account for their own email, that
-- meant any stranger who found your URL could sign in and see your data.
--
-- This replaces it with an email-scoped policy so that — even with a valid
-- session — only YOUR email can read or write rows at the database level.
--
-- 1. Replace 'you@example.com' below with your real login email.
-- 2. Run this in the Supabase SQL editor.
-- ============================================================================

alter table public.jobs enable row level security;

drop policy if exists "authenticated full access" on public.jobs;
drop policy if exists "owner only" on public.jobs;

create policy "owner only"
    on public.jobs
    for all
    to authenticated
    using ( (auth.jwt() ->> 'email') = 'you@example.com' )
    with check ( (auth.jwt() ->> 'email') = 'you@example.com' );
