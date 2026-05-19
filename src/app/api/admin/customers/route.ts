import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/requireAdmin";

export const runtime = "nodejs";

// GET /api/admin/customers — list all customers with usage stats
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const admin = createSupabaseAdmin();
  const { data, error } = await admin.from("customer_usage").select("*").order("registered_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ customers: data });
}

// POST /api/admin/customers — create new customer + initial password
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = (await req.json()) as { email: string; companyName: string };
  if (!body.email || !body.companyName) {
    return NextResponse.json({ error: "email and companyName required" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  // Generate a random initial password (12 chars)
  const password = generatePassword(12);

  const { data, error } = await admin.auth.admin.createUser({
    email: body.email,
    password,
    email_confirm: true, // skip email confirmation; admin issues the account
    user_metadata: { company_name: body.companyName, role: "customer" },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({
    id: data.user.id,
    email: data.user.email,
    initialPassword: password, // shown ONCE to admin
  });
}

function generatePassword(len: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#";
  let out = "";
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  for (let i = 0; i < len; i++) out += chars[arr[i] % chars.length];
  return out;
}
