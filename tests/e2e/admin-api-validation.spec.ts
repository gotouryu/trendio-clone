import fs from "node:fs";
import path from "node:path";
import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

function loadLocalEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split(/\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=['"]?(.*?)['"]?$/);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2];
    }
  }
}

async function loginAdmin(page: Page, email: string, password: string) {
  await page.goto("/portal-helix-2026/login");
  await page.locator("input[type=email]").fill(email);
  await page.locator("input[type=password]").fill(password);
  await page.getByRole("button", { name: /Admin Login|ログイン/i }).click();
  await page.waitForURL("**/admin", { timeout: 15000 });
}

test("admin customer API validates input and supports lifecycle actions", async ({ page }) => {
  loadLocalEnv();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  test.skip(!supabaseUrl || !serviceRoleKey, "Supabase env is required.");

  const admin = createClient(supabaseUrl!, serviceRoleKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const email = `qa-admin-${Date.now()}@karteia-test.example`;
  const password = "QaAdmin!23456789";
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { company_name: "QA Admin", role: "admin" },
  });
  expect(created.error).toBeNull();
  const adminId = created.data.user?.id;
  expect(adminId).toBeTruthy();
  const roleUpdate = await admin
    .from("profiles")
    .update({ role: "admin", company_name: "QA Admin", status: "active" })
    .eq("id", adminId);
  expect(roleUpdate.error).toBeNull();

  let customerId: string | null = null;
  try {
    await loginAdmin(page, email, password);

    const list = await page.evaluate(async () => {
      const response = await fetch("/api/admin/customers");
      return { status: response.status, json: await response.json() };
    });
    expect(list.status).toBe(200);

    for (const body of [
      { email: "bad-email", companyName: "x" },
      { email: "qa-long@example.com", companyName: "x".repeat(200) },
      { email: "qa-missing-company@example.com", companyName: "" },
    ]) {
      const result = await page.evaluate(async (payload) => {
        const response = await fetch("/api/admin/customers", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        return { status: response.status, json: await response.json() };
      }, body);
      expect(result.status).toBe(400);
    }

    const createdCustomer = await page.evaluate(async () => {
      const response = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: `qa-customer-${Date.now()}@karteia-test.example`,
          companyName: "QA Created Customer",
        }),
      });
      return { status: response.status, json: await response.json() };
    });
    expect(createdCustomer.status).toBe(200);
    customerId = createdCustomer.json.id;
    expect(customerId).toBeTruthy();

    const suspend = await page.evaluate(async (id) => {
      const response = await fetch(`/api/admin/customers/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "suspend" }),
      });
      return { status: response.status, json: await response.json() };
    }, customerId);
    expect(suspend.status).toBe(200);
    expect(suspend.json.status).toBe("suspended");

    const resume = await page.evaluate(async (id) => {
      const response = await fetch(`/api/admin/customers/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "resume" }),
      });
      return { status: response.status, json: await response.json() };
    }, customerId);
    expect(resume.status).toBe(200);
    expect(resume.json.status).toBe("active");

    const invalidAction = await page.evaluate(async (id) => {
      const response = await fetch(`/api/admin/customers/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "bad-action" }),
      });
      return { status: response.status, json: await response.json() };
    }, customerId);
    expect(invalidAction.status).toBe(400);

    const deleted = await page.evaluate(async (id) => {
      const response = await fetch(`/api/admin/customers/${id}`, {
        method: "DELETE",
      });
      return { status: response.status };
    }, customerId);
    expect(deleted.status).toBe(200);
    customerId = null;
  } finally {
    if (customerId) await admin.auth.admin.deleteUser(customerId);
    if (adminId) await admin.auth.admin.deleteUser(adminId);
  }
});
