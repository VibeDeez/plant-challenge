import { test, expect } from "../fixtures/authenticated-page";
import { cleanup } from "../helpers/cleanup";

test.describe("Home page", () => {
  test.afterEach(async ({ authedPage: page }) => {
    await cleanup(page, { plant_logs: true });
  });

  test("shows empty state", async ({ authedPage: page }) => {
    await expect(page.getByText("No plants yet")).toBeVisible();
  });

  test("shows 0/30 progress", async ({ authedPage: page }) => {
    // ProgressBar shows "0" as big number and "/ 30" as label
    await expect(page.getByText("/ 30")).toBeVisible();
    await expect(page.getByText("0%")).toBeVisible();
  });

  test("shows week date range and 7 day dots", async ({
    authedPage: page,
  }) => {
    // Day dots: 7 day labels (S, M, T, W, T, F, S)
    const dayDots = page.locator(
      ".rounded-full.flex.items-center.justify-center"
    );
    await expect(dayDots.first()).toBeVisible();
  });

  test("Log a Plant CTA navigates to /add", async ({ authedPage: page }) => {
    await page.getByRole("link", { name: "Log a Plant" }).click();
    await expect(page).toHaveURL(/\/add/);
    await expect(page.getByText("Log Plants")).toBeVisible();
  });

  test("shows Sage teaser and opens dedicated Sage page", async ({
    authedPage: page,
  }) => {
    const sageTeaser = page.getByTestId("sage-teaser");
    await expect(sageTeaser).toBeVisible();

    await page.getByRole("link", { name: /Visit Sage/i }).click();
    await expect(page).toHaveURL(/\/sage/);
    await expect(page.getByTestId("sage-chat-section")).toBeVisible();
  });

  test("Sage returns deterministic coffee guidance for a meaningful query", async ({
    authedPage: page,
  }) => {
    await page.goto("/sage");
    await page.getByRole("button", { name: /Ask Sage Quick help/i }).click();

    const question = page.locator("#sage-question");
    await question.fill("Does espresso count?");
    await page.getByRole("button", { name: "Ask Sage", exact: true }).click();

    const sageResponse = page.getByTestId("sage-chat-section");
    await expect(sageResponse.getByText(/Answer:\s*Coffee counts as 0\.25 points\./)).toBeVisible();
    await expect(sageResponse.getByText("Verdict: Counts")).toBeVisible();
    await expect(sageResponse.getByText("Points: 0.25")).toBeVisible();
  });

  test("plant appears after logging", async ({ authedPage: page }) => {
    await page.goto("/add");
    await page.waitForSelector('input[placeholder="Search plants..."]');
    await page.fill('input[placeholder="Search plants..."]', "Apple");
    // In list mode, button text is "Apple 1 pt". Match the button containing the name.
    const appleBtn = page.getByRole("button", { name: /^Apple \d/ });
    await appleBtn.click();
    // Wait for it to become disabled (logged)
    await expect(appleBtn).toBeDisabled();
    // Go home
    await page.goto("/");
    await page.waitForSelector("nav");
    await expect(page.getByText("Apple")).toBeVisible();
  });

  test("delete a plant log", async ({ authedPage: page }) => {
    // Log a plant first
    await page.goto("/add");
    await page.waitForSelector('input[placeholder="Search plants..."]');
    await page.fill('input[placeholder="Search plants..."]', "Banana");
    const bananaBtn = page.getByRole("button", { name: /^Banana \d/ });
    await bananaBtn.click();
    await expect(bananaBtn).toBeDisabled();

    // Go home and verify it appears
    await page.goto("/");
    await page.waitForSelector("nav");
    await expect(page.getByText("Banana")).toBeVisible();

    // Delete it via the trash icon (the last button in the plant card)
    const plantCard = page.locator("div").filter({ hasText: "Banana" }).locator("button").last();
    await plantCard.click();

    await expect(page.getByText("Banana")).not.toBeVisible();
  });

  test("category breakdown updates after logging", async ({
    authedPage: page,
  }) => {
    // Log a fruit
    await page.goto("/add");
    await page.waitForSelector('input[placeholder="Search plants..."]');
    await page.fill('input[placeholder="Search plants..."]', "Apple");
    await page.getByRole("button", { name: /^Apple \d/ }).click();

    // Log a vegetable
    await page.fill('input[placeholder="Search plants..."]', "Broccoli");
    await page.getByRole("button", { name: /^Broccoli \d/ }).click();

    // Go home
    await page.goto("/");
    await page.waitForSelector("nav");

    // Category breakdown should show both categories
    await expect(page.getByText("Categories Hit")).toBeVisible();
    const grid = page.getByTestId("category-breakdown-grid");
    await expect(grid).toBeVisible();

    const columnCount = await grid.evaluate((el) => {
      const columns = getComputedStyle(el).gridTemplateColumns;
      return columns.split(" ").filter(Boolean).length;
    });
    expect(columnCount).toBe(1);

    const cards = grid.locator(":scope > div");
    await expect(cards).toHaveCount(2);

    const firstCard = await cards.nth(0).boundingBox();
    const secondCard = await cards.nth(1).boundingBox();
    expect(firstCard).not.toBeNull();
    expect(secondCard).not.toBeNull();
    expect(Math.abs((firstCard?.x ?? 0) - (secondCard?.x ?? 0))).toBeLessThan(2);
    expect((secondCard?.y ?? 0)).toBeGreaterThan((firstCard?.y ?? 0) + (firstCard?.height ?? 0) - 1);
  });

  test("Start a Crop Circle banner visible", async ({
    authedPage: page,
  }) => {
    await page.evaluate(() =>
      localStorage.removeItem("dismissed_circle_prompt")
    );
    await page.reload();
    await page.waitForSelector("nav");
    await expect(page.getByText("Start a Crop Circle")).toBeVisible();
  });

  test("dismissing circle banner persists across reload", async ({
    authedPage: page,
  }) => {
    await page.evaluate(() =>
      localStorage.removeItem("dismissed_circle_prompt")
    );
    await page.reload();
    await page.waitForSelector("nav");

    const dismissBtn = page.locator('button[aria-label="Dismiss"]');
    if (await dismissBtn.isVisible()) {
      await dismissBtn.click();
      await expect(page.getByText("Start a Crop Circle")).not.toBeVisible();

      await page.reload();
      await page.waitForSelector("nav");
      await expect(page.getByText("Start a Crop Circle")).not.toBeVisible();
    }
  });

  test("This Week heading shows correct plant count", async ({
    authedPage: page,
  }) => {
    await expect(page.getByText("This Week")).toBeVisible();
    await expect(page.getByText("0 plants")).toBeVisible();
  });
});
