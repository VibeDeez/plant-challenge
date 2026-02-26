import { type Page } from "@playwright/test";
import { login } from "./auth";

type CleanupOptions = {
  plant_logs?: boolean;
  circles?: boolean;
  kids?: boolean;
  restore_owner_name?: boolean;
};

export async function cleanup(
  page: Page,
  opts: CleanupOptions
): Promise<void> {
  let res = await page.request.post("/api/e2e/cleanup", { data: opts });

  // Some tests intentionally sign out. Re-auth once so teardown can still run.
  if (res.status() === 401) {
    await login(page);
    res = await page.request.post("/api/e2e/cleanup", { data: opts });
  }

  if (res.ok()) return;

  const body = await res.text();
  throw new Error(`Cleanup failed (${res.status()}): ${body}`);
}
