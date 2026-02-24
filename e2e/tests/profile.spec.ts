import { test, expect } from "../fixtures/authenticated-page";
import { cleanup } from "../helpers/cleanup";

test.describe("Profile page", () => {
  test.afterEach(async ({ authedPage: page }) => {
    await cleanup(page, { kids: true, restore_owner_name: true });
  });

  test.beforeEach(async ({ authedPage: page }) => {
    await page.goto("/profile");
    await page.waitForSelector("nav");
  });

  test("shows Profile heading", async ({ authedPage: page }) => {
    await expect(
      page.locator("h1").filter({ hasText: "Profile" })
    ).toBeVisible();
  });

  test("shows owner card with Me and Account owner", async ({
    authedPage: page,
  }) => {
    await expect(page.getByText("Me", { exact: true })).toBeVisible();
    await expect(page.getByText("Account owner")).toBeVisible();
  });

  test("edit owner name", async ({ authedPage: page }) => {
    // Click the pencil button on the owner card
    const pencilBtn = page
      .locator("button")
      .filter({ has: page.locator('svg.text-brand-dark\\/60') })
      .first();
    await pencilBtn.click();

    // Should show an editing form
    const nameInput = page.locator('input[type="text"]').first();
    await expect(nameInput).toBeVisible();
    await nameInput.fill("Test User");
    await page.getByRole("button", { name: "Save" }).click();

    // Verify name changed
    await expect(page.getByText("Test User")).toBeVisible();
  });

  test("Family section shows empty state", async ({ authedPage: page }) => {
    await expect(page.getByText("No kids added yet")).toBeVisible();
  });

  test("add kid", async ({ authedPage: page }) => {
    // Click "Add Kid" link/button in the section header
    await page
      .locator("button")
      .filter({ hasText: "Add Kid" })
      .first()
      .click();

    // Modal should open with "Add Kid" heading
    await expect(
      page.locator("h3").filter({ hasText: "Add Kid" })
    ).toBeVisible();

    // Fill in the name
    await page.fill('input[placeholder="Kid\'s name"]', "Test Kid");

    // Submit the modal (button says "Add Kid")
    await page
      .locator('button[type="submit"]')
      .filter({ hasText: "Add Kid" })
      .click();

    // Kid card should appear
    await expect(page.getByText("Test Kid")).toBeVisible();
  });

  test("edit kid", async ({ authedPage: page }) => {
    // First add a kid
    await page
      .locator("button")
      .filter({ hasText: "Add Kid" })
      .first()
      .click();
    await page.fill('input[placeholder="Kid\'s name"]', "Kid To Edit");
    await page
      .locator('button[type="submit"]')
      .filter({ hasText: "Add Kid" })
      .click();
    await expect(page.getByText("Kid To Edit")).toBeVisible();

    // Click the pencil icon on the kid card — it's the first button sibling of the name
    const kidName = page.getByText("Kid To Edit", { exact: true });
    // Navigate up to the flex parent and click first button (pencil)
    await kidName.locator("..").locator("button").first().click();

    // Modal opens — fill new name
    await page.locator('input[placeholder="Kid\'s name"]').fill("Edited Kid");
    await page
      .locator('button[type="submit"]')
      .filter({ hasText: "Save Changes" })
      .click();

    await expect(page.getByText("Edited Kid")).toBeVisible();
  });

  test("delete kid", async ({ authedPage: page }) => {
    // Add a kid first
    await page
      .locator("button")
      .filter({ hasText: "Add Kid" })
      .first()
      .click();
    await page.fill('input[placeholder="Kid\'s name"]', "Kid To Delete");
    await page
      .locator('button[type="submit"]')
      .filter({ hasText: "Add Kid" })
      .click();
    await expect(page.getByText("Kid To Delete")).toBeVisible();

    // Set up dialog handler to auto-accept the confirm
    page.on("dialog", (dialog: { accept: () => Promise<void> }) =>
      dialog.accept()
    );

    // Click the trash button on the kid card
    const kidCard = page.locator("div").filter({ hasText: "Kid To Delete" });
    const trashBtn = kidCard.locator("button").filter({
      has: page.locator('svg'),
    }).last();
    await trashBtn.click();

    // Kid should disappear
    await expect(page.getByText("Kid To Delete")).not.toBeVisible();
  });

  test("Sign Out redirects to /auth", async ({ authedPage: page }) => {
    await page.getByText("Sign Out").click();
    await expect(page).toHaveURL(/\/auth/);
  });
});
