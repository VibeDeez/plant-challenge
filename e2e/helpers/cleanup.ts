import { type Page } from "@playwright/test";

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
  const res = await page.request.post("/api/e2e/cleanup", {
    data: opts,
  });
  if (!res.ok()) {
    const body = await res.text();
    console.warn(`Cleanup failed (${res.status()}): ${body}`);
  }
}
