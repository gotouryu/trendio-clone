// One-shot: create the initial admin user.
// Usage:
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/create-admin.mjs <email>
import { createClient } from "@supabase/supabase-js";

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/create-admin.mjs <email>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars");
  process.exit(1);
}

function generatePassword(len = 14) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  const arr = new Uint8Array(len);
  globalThis.crypto.getRandomValues(arr);
  let out = "";
  for (let i = 0; i < len; i++) out += chars[arr[i] % chars.length];
  return out;
}

const password = generatePassword(14);

const supa = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log("Creating admin user:", email);
const { data, error } = await supa.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { company_name: "Helix Plus", role: "admin" },
});

if (error) {
  console.error("❌ Failed:", error.message);
  process.exit(1);
}

console.log("✅ Created. User id:", data.user.id);
console.log("");
console.log("=================================================");
console.log("管理者ログイン情報(=この画面でしか表示されません)");
console.log("=================================================");
console.log("URL:      https://karteia.vercel.app/portal-helix-2026/login");
console.log("Email:   ", email);
console.log("Password:", password);
console.log("=================================================");
