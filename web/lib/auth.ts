// Central access control for the private dashboard.
//
// Set ALLOWED_EMAILS (comma-separated) in your environment to lock the app to
// specific people. Magic-link sign-in lets ANYONE request a link to their own
// email, so this allowlist — plus the email-scoped RLS policy in Supabase — is
// what actually keeps the dashboard private.
//
// If ALLOWED_EMAILS is unset/empty, any authenticated user is allowed (the old
// behavior) — so set it to lock down.
export function isAllowedEmail(email: string | null | undefined): boolean {
  const raw = process.env.ALLOWED_EMAILS;
  if (!raw || !raw.trim()) return true; // not configured → allow all

  if (!email) return false;
  const allowed = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.toLowerCase());
}
