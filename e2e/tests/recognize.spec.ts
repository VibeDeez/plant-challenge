import { test, expect } from "../fixtures/authenticated-page";

test.describe("/api/recognize", () => {
  test("rejects unsafe non-image data URL payload", async ({ authedPage: page }) => {
    const response = await page.request.post("/api/recognize", {
      data: { image: "not-a-data-image-url" },
    });

    expect(response.status()).toBe(400);
    const body = (await response.json()) as { error?: string };
    expect(body.error).toContain("data:image");
  });
});
