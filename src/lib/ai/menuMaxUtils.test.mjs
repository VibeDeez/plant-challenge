import assert from "node:assert/strict";
import test from "node:test";
import {
  extractVisibleTextFromHtml,
  isValidMenuImageDataUrl,
  mergeLogCandidates,
  trimSourceText,
} from "./menuMaxUtils.ts";

test("extractVisibleTextFromHtml removes scripts and tags", () => {
  const html = `
    <html>
      <head><style>.x{color:red}</style></head>
      <body>
        <h1>Menu</h1>
        <p>Chickpea bowl</p>
        <script>console.log("ignore")</script>
      </body>
    </html>
  `;
  const text = extractVisibleTextFromHtml(html);
  assert.match(text, /Menu Chickpea bowl/);
  assert.doesNotMatch(text, /ignore/);
});

test("trimSourceText caps long content", () => {
  const long = "a".repeat(12050);
  const trimmed = trimSourceText(long, 12000);
  assert.equal(trimmed.length, 12003);
  assert.ok(trimmed.endsWith("..."));
});

test("isValidMenuImageDataUrl validates image data URLs", () => {
  assert.equal(
    isValidMenuImageDataUrl("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA"),
    true
  );
  assert.equal(isValidMenuImageDataUrl("data:text/plain;base64,abcd"), false);
});

test("mergeLogCandidates merges canonical duplicates across dishes", () => {
  const merged = mergeLogCandidates([
    {
      rank: 1,
      dishName: "Bowl A",
      estimatedPoints: 2,
      estimatedUniquePlants: 2,
      why: "good",
      plants: [
        {
          name: "red bell pepper",
          category: "Vegetables",
          points: 1,
          matched: false,
          duplicateThisWeek: false,
        },
      ],
    },
    {
      rank: 2,
      dishName: "Bowl B",
      estimatedPoints: 2,
      estimatedUniquePlants: 2,
      why: "great",
      plants: [
        {
          name: "green bell pepper",
          category: "Vegetables",
          points: 1,
          matched: false,
          duplicateThisWeek: false,
        },
      ],
    },
  ]);

  assert.equal(merged.length, 1);
  assert.equal(merged[0].sourceDishes.length, 2);
});
