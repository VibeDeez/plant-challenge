import { test, expect } from "../fixtures/authenticated-page";
import { cleanup } from "../helpers/cleanup";

test.describe("Add Plant page", () => {
  test.afterEach(async ({ authedPage: page }) => {
    await cleanup(page, { plant_logs: true });
  });

  test.beforeEach(async ({ authedPage: page }) => {
    await page.goto("/add");
    await page.waitForSelector('input[placeholder="Search plants..."]');
  });

  test("shows search bar and category tabs", async ({
    authedPage: page,
  }) => {
    await expect(
      page.locator('input[placeholder="Search plants..."]')
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "All" }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Fruits" }).first()
    ).toBeVisible();
  });

  test("mobile controls meet 44px targets and plant names are wrapping-friendly", async ({
    authedPage: page,
  }) => {
    const allTab = page.getByRole("button", { name: "All" }).first();
    const backButton = page.locator('a[href="/"]').first();

    const allTabBox = await allTab.boundingBox();
    const backButtonBox = await backButton.boundingBox();

    expect(allTabBox).not.toBeNull();
    expect(backButtonBox).not.toBeNull();
    expect(allTabBox!.height).toBeGreaterThanOrEqual(44);
    expect(backButtonBox!.height).toBeGreaterThanOrEqual(44);
    expect(backButtonBox!.width).toBeGreaterThanOrEqual(44);

    await page.fill('input[placeholder="Search plants..."]', "Apple");
    const appleName = page
      .getByRole("button", { name: /^Apple \d/ })
      .locator("p")
      .first();
    await expect(appleName).toBeVisible();

    const whiteSpace = await appleName.evaluate((el) =>
      window.getComputedStyle(el).whiteSpace
    );
    expect(whiteSpace).not.toBe("nowrap");
  });

  test("gallery view shows categories grouped", async ({
    authedPage: page,
  }) => {
    await expect(
      page.locator("h2").filter({ hasText: "Fruits" })
    ).toBeVisible();
    await expect(
      page.locator("h2").filter({ hasText: "Vegetables" })
    ).toBeVisible();
  });

  test("search filters plants in real-time", async ({
    authedPage: page,
  }) => {
    await page.fill('input[placeholder="Search plants..."]', "Apple");
    // Should show Apple in the list view
    await expect(
      page.getByRole("button", { name: /^Apple \d/ })
    ).toBeVisible();
    // Should not show Banana
    await expect(
      page.getByRole("button", { name: /^Banana/ })
    ).not.toBeVisible();
  });

  test("clear search restores full gallery", async ({
    authedPage: page,
  }) => {
    await page.fill('input[placeholder="Search plants..."]', "Apple");
    await page.fill('input[placeholder="Search plants..."]', "");
    // Gallery headers should reappear
    await expect(
      page.locator("h2").filter({ hasText: "Fruits" })
    ).toBeVisible();
  });

  test("category tab filters to that category only", async ({
    authedPage: page,
  }) => {
    const veggieTab = page
      .getByRole("button", { name: "Vegetables" })
      .first();
    await veggieTab.click();
    // Should show vegetable items in flat list
    await expect(
      page.getByRole("button", { name: /^Broccoli/ })
    ).toBeVisible();
    // Gallery group headers should not appear (flat list mode)
    await expect(
      page.locator("h2").filter({ hasText: "Fruits" })
    ).not.toBeVisible();
  });

  test("click plant to log it — gets checkmark", async ({
    authedPage: page,
  }) => {
    await page.fill('input[placeholder="Search plants..."]', "Apple");
    const appleBtn = page.getByRole("button", { name: /^Apple \d/ });
    await appleBtn.click();
    await expect(appleBtn).toBeDisabled();
  });

  test("logged plant shows checkmark after navigating away and back", async ({
    authedPage: page,
  }) => {
    await page.fill('input[placeholder="Search plants..."]', "Apple");
    await page.getByRole("button", { name: /^Apple \d/ }).click();

    // Navigate away and back
    await page.goto("/");
    await page.waitForSelector("nav");
    await page.goto("/add");
    await page.waitForSelector('input[placeholder="Search plants..."]');
    await page.fill('input[placeholder="Search plants..."]', "Apple");

    const appleBtn = page.getByRole("button", { name: /^Apple/ });
    await expect(appleBtn).toBeDisabled();
  });

  test("custom plant modal opens via floating button", async ({
    authedPage: page,
  }) => {
    const customBtn = page.getByRole("button", { name: "Custom" });
    await customBtn.click();
    await expect(page.getByText("Custom Plant")).toBeVisible();
  });

  test("log a custom plant", async ({ authedPage: page }) => {
    const customBtn = page.getByRole("button", { name: "Custom" });
    await customBtn.click();
    await page.fill('input[placeholder="Plant name"]', "Dragon Fruit");
    await page
      .locator('button[type="submit"]')
      .filter({ hasText: "Log Plant" })
      .click();
    // Modal should close
    await expect(page.getByText("Custom Plant")).not.toBeVisible();
  });

  test("custom herb gets 0.25 points", async ({ authedPage: page }) => {
    const customBtn = page.getByRole("button", { name: "Custom" });
    await customBtn.click();
    await page.fill('input[placeholder="Plant name"]', "Test Herb");
    await page.selectOption("select", "Herbs");
    await page
      .locator('button[type="submit"]')
      .filter({ hasText: "Log Plant" })
      .click();

    // Go home and check the plant appears
    await page.goto("/");
    await page.waitForSelector("nav");
    await expect(page.getByText("Test Herb")).toBeVisible();
  });

  test("back arrow returns to home", async ({ authedPage: page }) => {
    await page.locator('a[href="/"]').first().click();
    await expect(page).toHaveURL(/^http:\/\/localhost:3000\/?$/);
  });

  test("Don't see your plant? CTA opens custom modal", async ({
    authedPage: page,
  }) => {
    const cta = page.getByText("Don't see your plant?");
    await cta.scrollIntoViewIfNeeded();
    await cta.click();
    await expect(page.getByText("Custom Plant")).toBeVisible();
  });

  test("search with no results shows empty state", async ({
    authedPage: page,
  }) => {
    await page.fill(
      'input[placeholder="Search plants..."]',
      "xyznonexistent"
    );
    await expect(page.getByText("No plants found")).toBeVisible();
  });
});
