import { type Page, type Response } from "@playwright/test";

function compact(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

async function responseSnippet(response: Response): Promise<string> {
  try {
    const body = await response.text();
    return compact(body).slice(0, 240);
  } catch {
    return "<unavailable>";
  }
}

export async function login(page: Page): Promise<void> {
  const response = await page.goto("/api/e2e/login", {
    waitUntil: "domcontentloaded",
    timeout: 15_000,
  });

  if (!response) {
    throw new Error(
      "[e2e-auth] GET /api/e2e/login did not return a response (possible navigation abort/network issue)."
    );
  }

  const status = response.status();
  const contentType = response.headers()["content-type"] ?? "unknown";

  if (status >= 400) {
    const snippet = await responseSnippet(response);
    throw new Error(
      `[e2e-auth] Login bootstrap failed: GET /api/e2e/login returned ${status} (${contentType}). Body: ${snippet}`
    );
  }

  // Fast-fail when login route did not redirect and rendered an error payload/page.
  const finalUrl = new URL(page.url());
  if (finalUrl.pathname.startsWith("/api/e2e/login")) {
    const pageText = compact((await page.locator("body").innerText().catch(() => "")).slice(0, 240));
    const hasErrorMarker = /\berror\b|not found|credentials/i.test(pageText);
    if (hasErrorMarker) {
      throw new Error(
        `[e2e-auth] Login stayed on /api/e2e/login with status ${status} (${contentType}). Body: ${pageText || "<empty>"}`
      );
    }
  }

  // The login route redirects to "/". Wait for the bottom nav to confirm the app loaded.
  await page.waitForSelector("nav", { timeout: 15_000 });
}
