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

test("resilience guards cover repeated clicks, unconnected SNS, malformed AI payloads", async ({ page }) => {
  loadLocalEnv();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  test.skip(!supabaseUrl || !serviceRoleKey, "Supabase env is required.");

  const admin = createClient(supabaseUrl!, serviceRoleKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const email = `qa-resilience-${Date.now()}@karteia-test.example`;
  const password = "QaTest!23456789";
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { company_name: "QA Resilience", role: "customer" },
  });
  expect(created.error).toBeNull();
  const userId = created.data.user?.id;
  expect(userId).toBeTruthy();

  try {
    await login(page, email, password);

    const repeatedCustomers = await page.evaluate(async () => {
      const body = JSON.stringify({
        instagramHandle: "qa_repeat_handle",
        displayName: "特殊文字テスト株式会社 🎯 <script>",
      });
      const responses = await Promise.all(
        Array.from({ length: 10 }, () =>
          fetch("/api/customers", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body,
          }).then(async (response) => ({
            status: response.status,
            json: await response.json(),
          })),
        ),
      );
      return responses;
    });
    expect(repeatedCustomers.every((r) => r.status === 200)).toBe(true);
    expect(
      new Set(repeatedCustomers.map((r) => r.json.customer?.id).filter(Boolean)).size,
    ).toBe(1);

    for (const url of ["/api/instagram/insights", "/api/tiktok/insights"]) {
      const result = await page.evaluate(async (requestUrl) => {
        const response = await fetch(requestUrl);
        return { status: response.status, json: await response.json() };
      }, url);
      expect(result.status).toBe(200);
      expect(result.json.mock).toBe(true);
    }

    const processResults = await page.evaluate(async () => {
      const body = JSON.stringify({
        commentId: `qa-comment-${Date.now()}`,
        commentText: "営業時間を教えてください",
        customerHandle: "qa_repeat_handle",
      });
      return Promise.all(
        Array.from({ length: 8 }, () =>
          fetch("/api/auto-reply/process", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body,
          }).then(async (response) => ({
            status: response.status,
            json: await response.json(),
          })),
        ),
      );
    });
    expect(processResults.every((r) => r.status < 500)).toBe(true);

    const badAutoReply = await page.evaluate(async () => {
      const response = await fetch("/api/auto-reply/process", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          commentId: "x".repeat(121),
          commentText: "hello",
          customerHandle: "qa",
        }),
      });
      return { status: response.status, json: await response.json() };
    });
    expect(badAutoReply.status).toBe(400);

    for (const url of ["/api/ai-reply", "/api/ai-report"]) {
      const invalidStatuses = await page.evaluate(async (requestUrl) => {
        const responses = await Promise.all(
          Array.from({ length: 5 }, () =>
            fetch(requestUrl, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({}),
            }).then((response) => response.status),
          ),
        );
        return responses;
      }, url);
      expect(invalidStatuses.every((status) => status === 400)).toBe(true);
    }

    const validReply = await page.evaluate(async () => {
      const response = await fetch("/api/ai-reply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ commentText: "営業時間を教えてください" }),
      });
      return { status: response.status, json: await response.json() };
    });
    expect(validReply.status).toBe(200);
    expect(typeof validReply.json.reply).toBe("string");
    expect(validReply.json.reply.length).toBeGreaterThan(0);

    const validReport = await page.evaluate(async () => {
      const response = await fetch("/api/ai-report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          platform: "instagram",
          period: "30",
          kpi: {
            followers: 100,
            profileViews: 20,
            totalImpressions: 500,
            totalReach: 300,
          },
          actionTrend: [],
          gender: { female: 50, male: 40, other: 10 },
          regions: [],
          hourly: [],
        }),
      });
      return { status: response.status, json: await response.json() };
    });
    expect(validReport.status).toBe(200);
    expect(typeof validReport.json.markdown).toBe("string");
    expect(validReport.json.markdown.length).toBeGreaterThan(0);
  } finally {
    if (userId) await admin.auth.admin.deleteUser(userId);
  }
});
