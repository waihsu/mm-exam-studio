import { expect, test } from "@playwright/test";

const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;

test.skip(!email || !password, "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run authenticated admin checks.");

test("signs in with a seeded admin account and opens the dashboard", async ({ page }) => {
  await page.goto("/signin?redirect=/dashboard");
  await page.getByLabel(/email/i).fill(email!);
  await page.getByLabel(/password/i).fill(password!);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();

  await expect.poll(() => new URL(page.url()).pathname).toBe("/dashboard");
  await expect(page.getByText("Operations overview", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /open question bank/i })).toBeVisible();
});
