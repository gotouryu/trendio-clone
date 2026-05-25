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

test("login API rate limits repeated failures", async ({ request }) => {
  const email = `rate-limit-${Date.now()}@example.com`;
  let lastStatus = 0;

  for (let i = 0; i < 6; i += 1) {
    const res = await request.post("/api/auth/login", {
      headers: {
        Origin: "http://localhost:3000",
        "Content-Type": "application/json",
      },
      data: { email, password: `WrongPass-${i}!` },
    });
    lastStatus = res.status();
  }

  expect(lastStatus).toBe(429);
});

test("forgot password API hides existence and blocks cross-origin", async ({ request }) => {
  const email = `forgot-${Date.now()}@example.com`;
  const sameOrigin = await request.post("/api/auth/forgot-password", {
    headers: {
      Origin: "http://localhost:3000",
      "Content-Type": "application/json",
    },
    data: { email },
  });
  expect(sameOrigin.status()).toBe(200);
  await expect(sameOrigin.json()).resolves.toEqual({ ok: true });

  const crossOrigin = await request.post("/api/auth/forgot-password", {
    headers: {
      Origin: "https://evil.example",
      "Content-Type": "application/json",
    },
    data: { email },
  });
  expect(crossOrigin.status()).toBe(403);
});
