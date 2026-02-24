import { test, expect } from "../fixtures/authenticated-page";
import { cleanup } from "../helpers/cleanup";
import { uniqueName } from "../helpers/constants";

test.describe("Circle Detail page", () => {
  let circleUrl: string;
  const circleName = uniqueName("Detail Circle");

  test.beforeEach(async ({ authedPage: page }) => {
    // Create a circle to test with
    await page.goto("/circles/create");
    await page.locator("#circle-name").fill(circleName);
    await page.getByRole("button", { name: "Create" }).click();
    await expect(
      page.getByText("Your Crop Circle is ready!")
    ).toBeVisible();
    // Navigate to the circle
    await page.getByRole("link", { name: "Go to Circle" }).click();
    await page.waitForURL(/\/circles\/[a-f0-9]{8}-/);
    circleUrl = page.url();
  });

  test.afterEach(async ({ authedPage: page }) => {
    await cleanup(page, { circles: true, plant_logs: true });
  });

  test("shows circle name and 1 member", async ({ authedPage: page }) => {
    await expect(page.getByText(circleName)).toBeVisible();
    await expect(page.getByText("1 member")).toBeVisible();
  });

  test("Leaderboard tab active by default", async ({
    authedPage: page,
  }) => {
    const lbBtn = page.getByRole("button", { name: "Leaderboard" });
    await expect(lbBtn).toHaveClass(/text-brand-green/);
  });

  test("This Week sub-tab active by default", async ({
    authedPage: page,
  }) => {
    const weekBtn = page.getByRole("button", { name: "This Week" });
    await expect(weekBtn).toHaveClass(/bg-brand-green/);
  });

  test("shows leaderboard content or empty state", async ({
    authedPage: page,
  }) => {
    // Either show scores or "No scores yet"
    const hasScores = await page.getByText("No scores yet").isVisible().catch(() => false);
    if (hasScores) {
      await expect(page.getByText("No scores yet")).toBeVisible();
    } else {
      // Test user should appear on leaderboard
      await expect(page.getByText("points")).toBeVisible();
    }
  });

  test("leaderboard updates after logging a plant", async ({
    authedPage: page,
  }) => {
    // Log a plant first
    await page.goto("/add");
    await page.waitForSelector('input[placeholder="Search plants..."]');
    await page.fill('input[placeholder="Search plants..."]', "Apple");
    const appleBtn = page.getByRole("button", { name: /^Apple \d/ });
    await appleBtn.click();
    // Wait for the log to complete (button becomes disabled)
    await expect(appleBtn).toBeDisabled();

    // Return to circle detail
    await page.goto(circleUrl);
    await expect(page.getByText(circleName)).toBeVisible();
    // Should now show points on leaderboard
    await expect(page.getByText("points").first()).toBeVisible();
  });

  test("All Time sub-tab switches view", async ({ authedPage: page }) => {
    await page.getByRole("button", { name: "All Time" }).click();
    await expect(page.getByRole("button", { name: "All Time" })).toHaveClass(
      /bg-brand-green/
    );
  });

  test("Activity tab shows content or empty state", async ({
    authedPage: page,
  }) => {
    await page.getByRole("button", { name: "Activity" }).click();
    // Wait for activity to load — should show "joined the circle" activity or empty state
    await expect(
      page.getByText("joined the circle").or(page.getByText("No activity yet"))
    ).toBeVisible();
  });

  test("Copy Invite Link button exists", async ({ authedPage: page }) => {
    await expect(page.getByText("Copy Invite Link")).toBeVisible();
  });

  test("settings gear visible (test user is admin)", async ({
    authedPage: page,
  }) => {
    // Settings link should be visible since we are admin
    const settingsLink = page.locator('a[href*="settings"]');
    await expect(settingsLink).toBeVisible();
  });

  test("back link returns to /circles", async ({ authedPage: page }) => {
    await page.getByText("Circles").first().click();
    await page.waitForURL("**/circles");
  });
});
