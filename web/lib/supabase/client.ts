import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client (anon key). Used in client components for auth.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
