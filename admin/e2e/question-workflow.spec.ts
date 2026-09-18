import { expect, test, type Page } from "@playwright/test";

const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;

test.skip(
  !email || !password,
  "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run authenticated admin checks."
);

async function signIn(page: Page) {
  await page.goto("/signin?redirect=/dashboard");
  await page.getByLabel(/email/i).fill(email!);
  await page.getByLabel(/password/i).fill(password!);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect.poll(() => new URL(page.url()).pathname).toBe("/dashboard");
}

async function selectFirstTaxonomyOption(
  page: Page,
  label: "Grade" | "Subject"
) {
  const field = page.getByText(label, { exact: true }).locator("..");
  await field.getByRole("combobox").click();
  await page.getByRole("option").nth(1).click();
}

async function deleteQuestionFromBank(page: Page, questionCode: string) {
  await page.goto("/questions");

  const search = page.getByPlaceholder("Search by question body or code");
  await search.fill(questionCode);

  const actions = page.getByRole("button", {
    name: `Open actions for ${questionCode}`,
  });
  await expect(actions).toBeVisible();
  await actions.click();
  await page.getByRole("menuitem", { name: "Delete", exact: true }).click();

  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole("button", { name: "Delete question", exact: true })
    .click();
  await expect(actions).toBeHidden();
}

test("creates, previews, reviews, publishes, and removes a temporary question", async ({
  page,
}) => {
  const questionCode = `E2E-WORKFLOW-${Date.now()}`;
  let created = false;
  let deleted = false;

  try {
    await signIn(page);
    await page.goto("/questions/new");
    await expect(
      page.getByRole("heading", { name: "Create question" })
    ).toBeVisible();

    await page.getByLabel("Question code").fill(questionCode);
    const coreSetup = page.locator("#question-setup");
    await coreSetup
      .getByText("Type", { exact: true })
      .locator("..")
      .getByRole("combobox")
      .click();
    await page
      .getByRole("option", { name: "Short Answer", exact: true })
      .click();

    await page
      .getByLabel("Question body")
      .fill("What is the capital city of Myanmar?");
    await page.getByLabel("Answer text").fill("Naypyidaw");
    await selectFirstTaxonomyOption(page, "Grade");
    await selectFirstTaxonomyOption(page, "Subject");

    await page
      .getByRole("button", { name: "Generate preview", exact: true })
      .click();
    await expect(
      page.getByText("Rendered sample", { exact: true })
    ).toBeVisible();
    await expect(
      page
        .locator("#question-preview")
        .getByText("What is the capital city of Myanmar?", { exact: true })
    ).toBeVisible();

    await page
      .getByRole("button", { name: "Save draft & review", exact: true })
      .click();
    await expect.poll(() => new URL(page.url()).pathname).toMatch(/^\/questions\/[^/]+$/);
    created = true;
    await expect(
      page.getByText("Question review", { exact: true })
    ).toBeVisible();

    await page
      .getByLabel("Reviewer notes")
      .fill("E2E temporary question: verified before publishing.");
    const reviewStatus = page
      .getByText("Review status", { exact: true })
      .locator("..");
    await reviewStatus.getByRole("combobox").click();
    await page.getByRole("option", { name: "In Review", exact: true }).click();
    await page
      .getByRole("button", { name: "Save review state", exact: true })
      .click();
    await expect(page.getByText("In Review", { exact: true })).toBeVisible();

    await reviewStatus.getByRole("combobox").click();
    await page.getByRole("option", { name: "Approved", exact: true }).click();
    await page
      .getByRole("button", { name: "Save review state", exact: true })
      .click();
    await expect(page.getByText("Approved", { exact: true })).toBeVisible();

    await page.getByRole("switch").click();
    await expect(page.getByText("Published", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Delete", exact: true }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    await dialog
      .getByRole("button", { name: "Delete question", exact: true })
      .click();
    await expect.poll(() => new URL(page.url()).pathname).toBe("/questions");
    deleted = true;
  } finally {
    if (created && !deleted) {
      await deleteQuestionFromBank(page, questionCode);
    }
  }
});
