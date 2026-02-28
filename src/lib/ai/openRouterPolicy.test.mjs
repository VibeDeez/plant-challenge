import assert from "node:assert/strict";
import test from "node:test";
import {
  parseBooleanFlag,
  RECOGNIZE_OPENROUTER_POLICY,
  SAGE_OPENROUTER_POLICY,
} from "./openRouterPolicy.ts";

test("parseBooleanFlag accepts common truthy values", () => {
  assert.equal(parseBooleanFlag("1"), true);
  assert.equal(parseBooleanFlag("true"), true);
  assert.equal(parseBooleanFlag("yes"), true);
  assert.equal(parseBooleanFlag(" TRUE "), true);
});

test("parseBooleanFlag rejects falsey and unknown values", () => {
  assert.equal(parseBooleanFlag(undefined), false);
  assert.equal(parseBooleanFlag("0"), false);
  assert.equal(parseBooleanFlag("false"), false);
  assert.equal(parseBooleanFlag("no"), false);
  assert.equal(parseBooleanFlag("enabled"), false);
});

test("OpenRouter policies expose non-zero operational limits", () => {
  assert.ok(RECOGNIZE_OPENROUTER_POLICY.timeoutMs > 0);
  assert.ok(RECOGNIZE_OPENROUTER_POLICY.maxRequestBytes > 0);
  assert.ok(SAGE_OPENROUTER_POLICY.timeoutMs > 0);
  assert.ok(SAGE_OPENROUTER_POLICY.maxRequestBytes > 0);
});
