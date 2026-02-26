import { test, expect } from "../fixtures/authenticated-page";
import { test as base, expect as baseExpect } from "@playwright/test";

test.describe("Navigation", () => {
  test("bottom nav shows Sage entry and all tabs", async ({ authedPage: page }) => {
    const nav = page.locator("nav");
    await expect(nav).toBeVisible();
    const links = nav.locator("a");
    await expect(links).toHaveCount(5);
    await expect(nav.getByText("Home")).toBeVisible();
    await expect(nav.getByText("Circles")).toBeVisible();
    await expect(nav.getByText("Sage")).toBeVisible();
    await expect(nav.getByText("Learn")).toBeVisible();
    await expect(nav.getByText("Profile")).toBeVisible();
  });

  test("Home tab is active on root page", async ({ authedPage: page }) => {
    const homeLink = page.locator('nav a[href="/"]');
    await expect(homeLink).toHaveClass(/text-brand-green/);
  });

  test("navigate to Circles via bottom nav", async ({ authedPage: page }) => {
    await page.locator('nav a[href="/circles"]').click();
    await expect(page).toHaveURL(/\/circles/);
    await expect(
      page.locator("h1").filter({ hasText: "Crop Circles" })
    ).toBeVisible();
  });

  test("navigate to Learn via bottom nav", async ({ authedPage: page }) => {
    await page.locator('nav a[href="/learn"]').click();
    await expect(page).toHaveURL(/\/learn/);
    await expect(
      page.locator("h1").filter({ hasText: "The Plantmaxxing Challenge" })
    ).toBeVisible();
  });

  test("navigate to Sage via bottom nav", async ({ authedPage: page }) => {
    await page.locator('nav a[href="/sage"]').click();
    await expect(page).toHaveURL(/\/sage/);
    await expect(
      page.locator("h1").filter({ hasText: "Sage" })
    ).toBeVisible();
    await expect(page.getByTestId("sage-chat-section")).toBeVisible();
  });

  test("navigate to Profile via bottom nav", async ({ authedPage: page }) => {
    await page.locator('nav a[href="/profile"]').click();
    await expect(page).toHaveURL(/\/profile/);
    await expect(
      page.locator("h1").filter({ hasText: "Profile" })
    ).toBeVisible();
  });
});

// This test uses a fresh browser context (no cookies) to verify redirect
base.describe("Auth redirect", () => {
  base("unauthenticated user is redirected to /auth", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    await page.waitForURL("**/auth");
    await baseExpect(page).toHaveURL(/\/auth/);
  });
});
