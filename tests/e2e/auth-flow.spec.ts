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
