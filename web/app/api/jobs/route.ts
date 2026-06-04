import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAllowedEmail } from "@/lib/auth";
import { buildJobsQuery, readFilters, PAGE_SIZE } from "@/lib/jobsQuery";
import type { Job } from "@/lib/types";

// Paginated job list for infinite scroll. Same filters as the dashboard page.
export async function GET(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAllowedEmail(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const page = Math.max(0, Number(sp.get("page") ?? "0") || 0);
  const filters = readFilters(sp);

  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error } = await buildJobsQuery(supabase, filters, from, to);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const jobs = (data ?? []) as Job[];
  return NextResponse.json({ jobs, hasMore: jobs.length === PAGE_SIZE });
}
