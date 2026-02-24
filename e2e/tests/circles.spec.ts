import { test, expect } from "../fixtures/authenticated-page";
import { cleanup } from "../helpers/cleanup";
import { uniqueName } from "../helpers/constants";

test.describe("Circles page", () => {
  test.afterEach(async ({ authedPage: page }) => {
    await cleanup(page, { circles: true });
  });

  test.beforeEach(async ({ authedPage: page }) => {
    await page.goto("/circles");
    await page.waitForSelector("nav");
  });

  test("shows empty state", async ({ authedPage: page }) => {
    await expect(page.getByText("No Crop Circles yet")).toBeVisible();
  });

  test("Create a Circle navigates to /circles/create", async ({
    authedPage: page,
  }) => {
    await page.getByRole("link", { name: "Create a Circle" }).click();
    await page.waitForURL("**/circles/create");
    await expect(page.getByText("Create a Crop Circle")).toBeVisible();
  });

  test("Join a Circle opens modal with invite code input", async ({
    authedPage: page,
  }) => {
    await page.getByRole("button", { name: "Join a Circle" }).click();
    await expect(
      page.locator("h2").filter({ hasText: "Join a Circle" })
    ).toBeVisible();
    await expect(page.locator("#join-code")).toBeVisible();
  });

  test("join modal enforces 6-char code", async ({ authedPage: page }) => {
    await page.getByRole("button", { name: "Join a Circle" }).click();
    const joinBtn = page.getByRole("button", { name: "Join" }).last();
    // Submit button should be disabled with less than 6 chars
    await expect(joinBtn).toBeDisabled();
    await page.locator("#join-code").fill("ABC");
    await expect(joinBtn).toBeDisabled();
  });

  test("join modal rejects invalid code", async ({ authedPage: page }) => {
    await page.getByRole("button", { name: "Join a Circle" }).click();
    await page.locator("#join-code").fill("ZZZZZZ");
    // Submit the form — the button may be behind the fixed nav, so use form submit
    await page.locator("#join-code").press("Enter");
    // Should show an error message
    await expect(page.locator(".text-red-600")).toBeVisible();
  });

  test("create circle form — name input, counter, disabled when empty", async ({
    authedPage: page,
  }) => {
    await page.goto("/circles/create");
    const nameInput = page.locator("#circle-name");
    await expect(nameInput).toBeVisible();
    // Character counter should show 0/50
    await expect(page.getByText("0/50 characters")).toBeVisible();
    // Submit disabled when empty
    const createBtn = page.getByRole("button", { name: "Create" });
    await expect(createBtn).toBeDisabled();
  });

  test("create circle success — invite code shown", async ({
    authedPage: page,
  }) => {
    await page.goto("/circles/create");
    const name = uniqueName("Test Circle");
    await page.locator("#circle-name").fill(name);
    await page.getByRole("button", { name: "Create" }).click();

    // Should show success screen with invite code
    await expect(
      page.getByText("Your Crop Circle is ready!")
    ).toBeVisible();
    await expect(page.getByText("Invite Code")).toBeVisible();
    // Copy, Share, Go buttons
    await expect(
      page.getByRole("button", { name: "Copy Link" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Share" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Go to Circle" })
    ).toBeVisible();
  });

  test("circle appears in list after creation", async ({
    authedPage: page,
  }) => {
    // Create a circle first
    await page.goto("/circles/create");
    const name = uniqueName("Listed Circle");
    await page.locator("#circle-name").fill(name);
    await page.getByRole("button", { name: "Create" }).click();
    await expect(
      page.getByText("Your Crop Circle is ready!")
    ).toBeVisible();

    // Go back to circles list
    await page.goto("/circles");
    await page.waitForSelector("nav");
    await expect(page.getByText(name)).toBeVisible();
  });

  test("Go to Circle link navigates to /circles/[id]", async ({
    authedPage: page,
  }) => {
    // Create a circle
    await page.goto("/circles/create");
    const name = uniqueName("Nav Circle");
    await page.locator("#circle-name").fill(name);
    await page.getByRole("button", { name: "Create" }).click();
    await expect(
      page.getByText("Your Crop Circle is ready!")
    ).toBeVisible();

    // Click Go to Circle
    await page.getByRole("link", { name: "Go to Circle" }).click();
    await page.waitForURL(/\/circles\/[a-f0-9]{8}-/);
    await expect(page.getByText(name)).toBeVisible();
  });
});
