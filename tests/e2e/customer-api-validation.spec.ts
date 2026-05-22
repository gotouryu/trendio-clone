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

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.locator("input[type=email]").fill(email);
  await page.locator("input[type=password]").fill(password);
  await page.locator("input[type=checkbox]").nth(1).check();
  await page.getByRole("button", { name: /Sign In/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 15000 });
}

test("customer API rejects invalid pagination and boolean payloads", async ({ page }) => {
  loadLocalEnv();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  test.skip(!supabaseUrl || !serviceRoleKey, "Supabase env is required.");

  const admin = createClient(supabaseUrl!, serviceRoleKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const email = `qa-regression-${Date.now()}@karteia-test.example`;
  const password = "QaTest!23456789";
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { company_name: "QA Regression", role: "customer" },
  });
  expect(created.error).toBeNull();
  const userId = created.data.user?.id;
  expect(userId).toBeTruthy();

  try {
    await login(page, email, password);

    const invalidCreate = await page.evaluate(async () => {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          instagramHandle: "qa_invalid_boolean",
          autoReplyEnabled: "not-boolean",
        }),
      });
      return { status: response.status, json: await response.json() };
    });
    expect(invalidCreate.status).toBe(400);

    const customer = await page.evaluate(async () => {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          instagramHandle: "qa_regression_user",
          displayName: "QA Regression",
        }),
      });
      return { status: response.status, json: await response.json() };
    });
    expect(customer.status).toBe(200);
    const customerId = customer.json.customer.id;
    expect(customerId).toBeTruthy();

    for (const url of [
      "/api/customers?limit=-5&offset=-100",
      "/api/customers?limit=10&offset=999999999",
      `/api/customers/${customerId}/interactions?limit=-5&offset=-10`,
      "/api/auto-reply/logs?limit=-5&offset=-10",
    ]) {
      const result = await page.evaluate(async (requestUrl) => {
        const response = await fetch(requestUrl);
        return { status: response.status, json: await response.json() };
      }, url);
      expect(result.status).toBe(400);
    }

    const invalidPatch = await page.evaluate(async (id) => {
      const response = await fetch(`/api/customers/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ autoReplyEnabled: "not-boolean" }),
      });
      return { status: response.status, json: await response.json() };
    }, customerId);
    expect(invalidPatch.status).toBe(400);

    const validPatch = await page.evaluate(async (id) => {
      const response = await fetch(`/api/customers/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ autoReplyEnabled: false }),
      });
      return { status: response.status, json: await response.json() };
    }, customerId);
    expect(validPatch.status).toBe(200);
    expect(validPatch.json.customer.autoReplyEnabled).toBe(false);
  } finally {
    if (userId) await admin.auth.admin.deleteUser(userId);
  }
});
