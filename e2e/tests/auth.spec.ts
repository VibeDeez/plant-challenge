import { test, expect } from "@playwright/test";

test.describe("Auth callback redirect sanitization", () => {
  test("unsafe next param never redirects externally", async ({
    page,
    baseURL,
  }) => {
    const appOrigin = new URL(baseURL ?? "http://localhost:3000").origin;
    const unsafeNext = "https://evil.example/phish";

    await page.goto(`/auth/callback?next=${encodeURIComponent(unsafeNext)}`);
    await page.waitForURL("**/auth?error=auth-code-error");

    const finalUrl = new URL(page.url());
    expect(finalUrl.origin).toBe(appOrigin);
    expect(finalUrl.pathname).toBe("/auth");
    expect(finalUrl.searchParams.get("error")).toBe("auth-code-error");
  });
});
