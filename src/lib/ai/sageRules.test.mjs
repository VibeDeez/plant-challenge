import assert from "node:assert/strict";
import test from "node:test";
import { matchDeterministicSageRule } from "./sageRules.ts";

test("coffee is deterministic 0.25 points", () => {
  const result = matchDeterministicSageRule("Does espresso count?");
  assert.ok(result);
  assert.equal(result?.ruleId, "coffee_quarter_point");
  assert.equal(result?.response.verdict, "counts");
  assert.equal(result?.response.points, 0.25);
});

test("tea is deterministic 0.25 points", () => {
  const result = matchDeterministicSageRule("How about matcha tea?");
  assert.ok(result);
  assert.equal(result?.ruleId, "tea_quarter_point");
  assert.equal(result?.response.verdict, "counts");
  assert.equal(result?.response.points, 0.25);
});

test("bell pepper color variants are one species and duplicate in week", () => {
  const result = matchDeterministicSageRule(
    "I had a red bell pepper today. Does it count?",
    { alreadyLoggedThisWeek: ["green bell pepper"] }
  );
  assert.ok(result);
  assert.equal(result?.ruleId, "duplicate_species_week");
  assert.equal(result?.response.verdict, "duplicate_week");
  assert.equal(result?.response.points, 0);
});

test("generic duplicate wording maps to duplicate_week rule", () => {
  const result = matchDeterministicSageRule(
    "If I log the same species again this week, does it add points?"
  );
  assert.ok(result);
  assert.equal(result?.ruleId, "duplicate_species_week");
  assert.equal(result?.response.verdict, "duplicate_week");
});

test("ambiguous red pepper wording does not trigger bell pepper deterministic rule", () => {
  const result = matchDeterministicSageRule(
    "Does red pepper flakes count as a plant point?"
  );
  assert.equal(result, null);
});

test("green peppercorn wording does not trigger bell pepper deterministic rule", () => {
  const result = matchDeterministicSageRule(
    "If I used green peppercorn, does that count?"
  );
  assert.equal(result, null);
});
