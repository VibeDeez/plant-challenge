import assert from "node:assert/strict";
import test from "node:test";
import {
  extractModelMessageContent,
  getSageRequestLimitError,
  makeDeterministicOnlySageFallbackResponse,
  parseSageTimeoutMs,
} from "./routeUtils.ts";

test("parseSageTimeoutMs returns default for invalid values", () => {
  assert.equal(parseSageTimeoutMs(undefined), 12_000);
  assert.equal(parseSageTimeoutMs(""), 12_000);
  assert.equal(parseSageTimeoutMs("abc"), 12_000);
  assert.equal(parseSageTimeoutMs("Infinity"), 12_000);
});

test("parseSageTimeoutMs clamps to sane range", () => {
  assert.equal(parseSageTimeoutMs("200"), 1_000);
  assert.equal(parseSageTimeoutMs("70000"), 60_000);
  assert.equal(parseSageTimeoutMs("1500"), 1_500);
});

test("getSageRequestLimitError validates question/context limits", () => {
  const tooLongQuestion = "x".repeat(501);
  assert.match(
    getSageRequestLimitError(tooLongQuestion) ?? "",
    /question exceeds max length/
  );

  const tooManyLogged = {
    alreadyLoggedThisWeek: Array.from({ length: 101 }, (_, index) => `plant-${index}`),
  };
  assert.match(
    getSageRequestLimitError("Does this count?", tooManyLogged) ?? "",
    /alreadyLoggedThisWeek exceeds max size/
  );

  const tooLongName = {
    recognizedPlants: [{ name: "a".repeat(121) }],
  };
  assert.match(
    getSageRequestLimitError("Does this count?", tooLongName) ?? "",
    /recognizedPlants\.name exceeds max length/
  );
});

test("getSageRequestLimitError returns null for valid payload", () => {
  const context = {
    alreadyLoggedThisWeek: ["coffee", "broccoli"],
    recognizedPlants: [{ name: "spinach", category: "leafy greens", points: 1 }],
  };
  assert.equal(getSageRequestLimitError("Does espresso count?", context), null);
});

test("extractModelMessageContent safely handles malformed payloads", () => {
  assert.equal(extractModelMessageContent(null), null);
  assert.equal(extractModelMessageContent({}), null);
  assert.equal(extractModelMessageContent({ choices: [] }), null);
  assert.equal(
    extractModelMessageContent({
      choices: [{ message: { content: "hello" } }],
    }),
    "hello"
  );
});


test("deterministic-only fallback response is explicit and safe", () => {
  const response = makeDeterministicOnlySageFallbackResponse();
  assert.equal(response.verdict, "uncertain");
  assert.equal(response.points, null);
  assert.match(response.answer, /deterministic-only mode/i);
  assert.match(response.reason, /disabled by configuration/i);
});
