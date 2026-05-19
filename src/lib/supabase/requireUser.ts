import { createSupabaseServer } from "./server";
import { NextResponse } from "next/server";

/**
 * Verify the current request has a valid customer/admin session.
 * Returns { ok: true, userId } if authenticated, otherwise a NextResponse 401/500.
 * Use this in API routes that operate on the caller's own data.
 */
export async function requireUser(): Promise<
  | { ok: true; userId: string; role: "customer" | "admin" }
  | { ok: false; response: NextResponse }
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
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  const { data: profile } = await sb
    .from("profiles")
    .select("role,status")
    .eq("id", data.user.id)
    .single();
  if (profile?.status === "suspended") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Account suspended" }, { status: 403 }),
    };
  }
  return {
    ok: true,
    userId: data.user.id,
    role: (profile?.role as "customer" | "admin") ?? "customer",
  };
}
