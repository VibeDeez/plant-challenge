import { test, expect } from "../fixtures/authenticated-page";

test.describe("Learn page", () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await page.goto("/learn");
  });

  test("shows hero heading", async ({ authedPage: page }) => {
    await expect(
      page.locator("h1").filter({ hasText: "The Plantmaxxing Challenge" })
    ).toBeVisible();
  });

  test("shows stat pills", async ({ authedPage: page }) => {
    await expect(page.getByText("30", { exact: true })).toBeVisible();
    await expect(page.getByText("plants / week")).toBeVisible();
    await expect(page.getByText("38T")).toBeVisible();
    await expect(page.getByText("gut microbes")).toBeVisible();
    await expect(page.getByText("days to reset")).toBeVisible();
  });

  test("Scoring System section renders", async ({ authedPage: page }) => {
    await expect(page.getByText("Scoring System")).toBeVisible();
    await expect(page.getByText("1 pt").first()).toBeVisible();
    // The 1/4 pt card uses HTML entity &frac14; which renders as ¼
    await expect(page.getByText("¼ pt")).toBeVisible();
    await expect(page.getByText("0 pts")).toBeVisible();
  });

  test("Tips for Hitting 30 section renders", async ({
    authedPage: page,
  }) => {
    await expect(page.getByText("Tips for Hitting 30")).toBeVisible();
    await expect(page.getByText("Power Breakfast")).toBeVisible();
    await expect(page.getByText("Spice Rack Hack")).toBeVisible();
  });

  test("The Science section renders", async ({ authedPage: page }) => {
    await expect(page.getByText("The Science")).toBeVisible();
    await expect(
      page.getByText("McDonald et al., 2018")
    ).toBeVisible();
  });

  test("Quick Reference FAQ section has accordions", async ({
    authedPage: page,
  }) => {
    await expect(page.getByText("Quick Reference")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Edge Cases" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Common Mistakes" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Special Situations" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Sample Week Meal Plan" })
    ).toBeVisible();
  });

  test("accordion expands on click", async ({ authedPage: page }) => {
    // "Common Mistakes" is collapsed by default
    const accordionBtn = page.getByRole("button", { name: "Common Mistakes" });
    await accordionBtn.click();
    await expect(page.getByText("Counting processed foods")).toBeVisible();
  });
});
