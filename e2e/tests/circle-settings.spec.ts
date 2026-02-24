import { test, expect } from "../fixtures/authenticated-page";
import { cleanup } from "../helpers/cleanup";
import { uniqueName } from "../helpers/constants";

test.describe("Circle Settings page", () => {
  let settingsUrl: string;
  let circleName: string;

  test.beforeEach(async ({ authedPage: page }) => {
    circleName = uniqueName("Settings Circle");
    // Create a circle
    await page.goto("/circles/create");
    await page.locator("#circle-name").fill(circleName);
    await page.getByRole("button", { name: "Create" }).click();
    await expect(
      page.getByText("Your Crop Circle is ready!")
    ).toBeVisible();
    // Navigate to the circle detail
    await page.getByRole("link", { name: "Go to Circle" }).click();
    await page.waitForURL(/\/circles\/[a-f0-9]{8}-/);
    // Navigate to settings
    const settingsLink = page.locator('a[href*="settings"]');
    await settingsLink.click();
    await page.waitForURL(/\/settings/);
    settingsUrl = page.url();
  });

  test.afterEach(async ({ authedPage: page }) => {
    await cleanup(page, { circles: true });
  });

  test("shows Circle Settings heading", async ({ authedPage: page }) => {
    await expect(
      page.locator("h1").filter({ hasText: "Circle Settings" })
    ).toBeVisible();
  });

  test("circle name input pre-filled", async ({ authedPage: page }) => {
    const nameInput = page.locator('input[type="text"]').first();
    await expect(nameInput).toHaveValue(circleName);
  });

  test("edit circle name — save confirmation", async ({
    authedPage: page,
  }) => {
    const nameInput = page.locator('input[type="text"]').first();
    const newName = uniqueName("Renamed");
    await nameInput.fill(newName);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Saved!")).toBeVisible();
  });

  test("invite code section shows 6-char code", async ({
    authedPage: page,
  }) => {
    await expect(page.getByText("Invite code")).toBeVisible();
    // The code is displayed in a monospace font with tracking-widest
    const code = page.locator(".font-mono.tracking-widest").first();
    const codeText = await code.textContent();
    expect(codeText?.trim().length).toBe(6);
  });

  test("copy link button exists", async ({ authedPage: page }) => {
    await expect(page.getByText("Copy Invite Link")).toBeVisible();
  });

  test("members section shows test user with Admin badge", async ({
    authedPage: page,
  }) => {
    await expect(page.getByRole("heading", { name: "Members" })).toBeVisible();
    await expect(page.getByText("Admin")).toBeVisible();
  });

  test("regenerate invite code", async ({ authedPage: page }) => {
    // Get current code
    const codeBefore = await page
      .locator(".font-mono.tracking-widest")
      .first()
      .textContent();

    // Accept the confirm dialog
    page.on("dialog", (dialog: { accept: () => Promise<void> }) => dialog.accept());

    // Click "New Code" button
    await page.getByRole("button", { name: "New Code" }).click();

    // Wait for regeneration
    await page.waitForTimeout(1000);

    // Code should have changed
    const codeAfter = await page
      .locator(".font-mono.tracking-widest")
      .first()
      .textContent();
    expect(codeAfter?.trim()).not.toBe(codeBefore?.trim());
  });

  test("delete circle — type name to confirm, redirect", async ({
    authedPage: page,
  }) => {
    // Click "Delete Circle" button
    await page.getByRole("button", { name: "Delete Circle" }).click();

    // Should show confirmation with input
    await expect(
      page.getByText("This will permanently delete")
    ).toBeVisible();

    // Delete button should be disabled until correct name typed
    const deleteBtn = page.getByRole("button", { name: "Delete Forever" });
    await expect(deleteBtn).toBeDisabled();

    // Type the circle name
    await page.locator(`input[placeholder="${circleName}"]`).fill(circleName);
    await expect(deleteBtn).toBeEnabled();

    // Click delete
    await deleteBtn.click();
    await page.waitForURL("**/circles");
  });

  test("delete button disabled until correct name typed", async ({
    authedPage: page,
  }) => {
    await page.getByRole("button", { name: "Delete Circle" }).click();
    const deleteBtn = page.getByRole("button", { name: "Delete Forever" });
    await expect(deleteBtn).toBeDisabled();

    // Type wrong name
    await page.locator(`input[placeholder="${circleName}"]`).fill("wrong");
    await expect(deleteBtn).toBeDisabled();

    // Type correct name
    await page.locator(`input[placeholder="${circleName}"]`).fill(circleName);
    await expect(deleteBtn).toBeEnabled();
  });
});
