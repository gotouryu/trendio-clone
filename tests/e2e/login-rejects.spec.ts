import { test, expect } from "@playwright/test";

test("wrong credentials show error", async ({ page }) => {
  await page.goto("/login");
  await page.locator("input[type=email]").fill("wrong@example.com");
  await page.locator("input[type=password]").fill("WrongPass!");
  const checkboxes = page.locator("input[type=checkbox]");
  await checkboxes.nth(1).check();
  await page.getByRole("button", { name: /Sign In/i }).click();
  await expect(page.getByText(/正しくありません/)).toBeVisible({ timeout: 5000 });
});
