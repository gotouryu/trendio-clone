import { test, expect } from "@playwright/test";

test("login with demo credentials reaches dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.locator("input[type=email]").fill("demo@trendio.example");
  await page.locator("input[type=password]").fill("Demo2026!");
  // The "I agree" checkbox is the second checkbox (first is Remember me).
  const checkboxes = page.locator("input[type=checkbox]");
  await checkboxes.nth(1).check();
  await page.getByRole("button", { name: /Sign In/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 10000 });
  await expect(page).toHaveURL(/\/dashboard/);
});
