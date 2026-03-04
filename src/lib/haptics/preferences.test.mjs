import assert from "node:assert/strict";
import test from "node:test";
import {
  HAPTICS_DEFAULT_ENABLED,
  parseStoredHapticsEnabled,
  serializeHapticsEnabled,
} from "./preferences.ts";

test("parseStoredHapticsEnabled accepts explicit true/false values", () => {
  assert.equal(parseStoredHapticsEnabled("true"), true);
  assert.equal(parseStoredHapticsEnabled("false"), false);
});

test("parseStoredHapticsEnabled falls back to app default", () => {
  assert.equal(parseStoredHapticsEnabled(null), HAPTICS_DEFAULT_ENABLED);
  assert.equal(parseStoredHapticsEnabled(""), HAPTICS_DEFAULT_ENABLED);
  assert.equal(parseStoredHapticsEnabled("yes"), HAPTICS_DEFAULT_ENABLED);
});

test("serializeHapticsEnabled writes stable storage values", () => {
  assert.equal(serializeHapticsEnabled(true), "true");
  assert.equal(serializeHapticsEnabled(false), "false");
});
