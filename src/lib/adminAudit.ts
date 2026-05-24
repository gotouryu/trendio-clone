import type { NextRequest } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function writeAdminAuditLog({
  actorUserId,
  action,
  targetUserId,
  payload,
  req,
}: {
  actorUserId: string;
  action: string;
  targetUserId?: string;
  payload?: Record<string, unknown>;
  req: NextRequest;
}) {
  try {
    const admin = createSupabaseAdmin();
    await admin.from("audit_log").insert({
      actor_user_id: actorUserId,
      action,
      target_user_id: targetUserId ?? null,
      payload: payload ?? null,
      ip:
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        req.headers.get("x-real-ip") ??
        null,
    });
  } catch {
    console.warn("[admin audit] write failed");
  }
}
