import { expect, test } from "@playwright/test";

test("renders the admin sign-in form", async ({ page }) => {
  await page.goto("/signin");

  await expect(page.getByText("Sign in to the admin console", { exact: true })).toBeVisible();
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByLabel(/password/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
});

test("redirects an unauthenticated visitor away from the admin dashboard", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/signin\?redirect=/);
  await expect(page.getByText("Sign in to the admin console", { exact: true })).toBeVisible();
});
