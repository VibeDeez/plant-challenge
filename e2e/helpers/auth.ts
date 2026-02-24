import { type Page } from "@playwright/test";

export async function login(page: Page): Promise<void> {
  await page.goto("/api/e2e/login");
  // The login route redirects to "/". Wait for the bottom nav to confirm the app loaded.
  await page.waitForSelector("nav", { timeout: 15_000 });
}
