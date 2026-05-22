import { test, expect } from "@playwright/test";

test("login with demo credentials reaches dashboard", async ({ page }) => {
  const email = process.env.E2E_LOGIN_EMAIL;
  const password = process.env.E2E_LOGIN_PASSWORD;
  test.skip(!email || !password, "Set E2E_LOGIN_EMAIL and E2E_LOGIN_PASSWORD to run login flow.");

  await page.goto("/login");
  await page.locator("input[type=email]").fill(email);
  await page.locator("input[type=password]").fill(password);
  // The "I agree" checkbox is the second checkbox (first is Remember me).
  const checkboxes = page.locator("input[type=checkbox]");
  await checkboxes.nth(1).check();
  await page.getByRole("button", { name: /Sign In/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 10000 });
  await expect(page).toHaveURL(/\/dashboard/);
});

test("ai content rejects invalid mode without consuming quota", async ({ page }) => {
  const email = process.env.E2E_LOGIN_EMAIL;
  const password = process.env.E2E_LOGIN_PASSWORD;
  test.skip(!email || !password, "Set E2E_LOGIN_EMAIL and E2E_LOGIN_PASSWORD to run login flow.");

  await page.goto("/login");
  await page.locator("input[type=email]").fill(email);
  await page.locator("input[type=password]").fill(password);
  const checkboxes = page.locator("input[type=checkbox]");
  await checkboxes.nth(1).check();
  await page.getByRole("button", { name: /Sign In/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 10000 });

  const beforeJson = await page.evaluate(async () => {
    const response = await fetch("/api/ai-content");
    return response.json();
  });

  const invalid = await page.evaluate(async () => {
    const response = await fetch("/api/ai-content", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mode: "bad-mode",
        brief: { target: "美容室オーナー", theme: "予約率改善" },
      }),
    });
    return { status: response.status, json: await response.json() };
  });
  expect(invalid.status).toBe(400);

  const afterJson = await page.evaluate(async () => {
    const response = await fetch("/api/ai-content");
    return response.json();
  });
  expect(afterJson.usage.used).toBe(beforeJson.usage.used);
});
