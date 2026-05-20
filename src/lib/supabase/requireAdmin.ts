import { createSupabaseServer } from "./server";
import { NextResponse } from "next/server";

/**
 * Verify the current request has an admin session.
 * Returns { ok: true } if admin, otherwise a NextResponse 401/403 to return.
 */
export async function requireAdmin(): Promise<
  { ok: true; userId: string } | { ok: false; response: NextResponse }
> {
  const sb = await createSupabaseServer();
  if (!sb) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Auth not configured" },
        { status: 500 },
      ),
    };
  }
  const { data, error } = await sb.auth.getUser();
  if (error || !data.user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      ),
    };
  }
  const { data: profile } = await sb
    .from("profiles")
    .select("role, status")
    .eq("id", data.user.id)
    .single();
  if (profile?.status === "suspended") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Account suspended" },
        { status: 403 },
      ),
    };
  }
  if (profile?.role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { ok: true, userId: data.user.id };
}
