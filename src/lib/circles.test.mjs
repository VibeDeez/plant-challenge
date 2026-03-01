import assert from "node:assert/strict";
import test from "node:test";
import {
  detectLeaderboardDiscrepancies,
  getShareUrl,
  isValidCircleId,
  isValidInviteCode,
  sanitizeActivityFeed,
  validateJoinCirclePayload,
  validateMembershipOperation,
} from "./circles.ts";

test("isValidCircleId rejects undefined-like path segments", () => {
  assert.equal(isValidCircleId("undefined"), false);
  assert.equal(isValidCircleId("null"), false);
  assert.equal(isValidCircleId(""), false);
});

test("isValidInviteCode enforces six-char invite format", () => {
  assert.equal(isValidInviteCode("ABC234"), true);
  assert.equal(isValidInviteCode("abc234"), true);
  assert.equal(isValidInviteCode("ABCD12!"), false);
  assert.equal(isValidInviteCode("AB12"), false);
});

test("getShareUrl uses plantmaxxing.com fallback and normalizes trailing slash", () => {
  const original = process.env.NEXT_PUBLIC_SITE_URL;

  delete process.env.NEXT_PUBLIC_SITE_URL;
  assert.equal(getShareUrl("ABC234"), "https://plantmaxxing.com/join/ABC234");

  process.env.NEXT_PUBLIC_SITE_URL = "https://plantmaxxing.com/";
  assert.equal(getShareUrl("ABC234"), "https://plantmaxxing.com/join/ABC234");

  if (original === undefined) {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  } else {
    process.env.NEXT_PUBLIC_SITE_URL = original;
  }
});

test("validateJoinCirclePayload blocks malformed success response without circle id", () => {
  const result = validateJoinCirclePayload({ success: true });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.message, /could not open/i);
  }
});

test("validateJoinCirclePayload accepts valid circle id", () => {
  const result = validateJoinCirclePayload({
    success: true,
    circle_id: "123e4567-e89b-12d3-a456-426614174000",
  });
  assert.deepEqual(result, {
    ok: true,
    circleId: "123e4567-e89b-12d3-a456-426614174000",
  });
});

test("validateJoinCirclePayload maps invalid/expired/reused errors to deterministic copy", () => {
  const invalid = validateJoinCirclePayload({ success: false, error: "invalid invite code" });
  const expired = validateJoinCirclePayload({ success: false, code: "EXPIRED_CODE" });
  const reused = validateJoinCirclePayload({ success: false, message: "already used" });

  assert.equal(invalid.ok, false);
  assert.equal(expired.ok, false);
  assert.equal(reused.ok, false);

  if (!invalid.ok) assert.match(invalid.message, /invalid/i);
  if (!expired.ok) assert.match(expired.message, /expired/i);
  if (!reused.ok) assert.match(reused.message, /already been used/i);
});

test("detectLeaderboardDiscrepancies catches duplicates, non-members, and sort drift", () => {
  const discrepancies = detectLeaderboardDiscrepancies({
    memberIds: ["m1", "m2"],
    weeklyScores: [
      { member_id: "m1", total_points: 5, is_ghost: true },
      { member_id: "m2", total_points: 10, is_ghost: false },
      { member_id: "m2", total_points: 8, is_ghost: false },
    ],
    alltimeScores: [{ member_id: "missing", total_points: 1, is_ghost: false }],
  });

  assert.ok(discrepancies.some((d) => d.includes("duplicate member_id m2")));
  assert.ok(discrepancies.some((d) => d.includes("non-member missing")));
  assert.ok(discrepancies.some((d) => d.includes("not sorted")));
});

test("validateMembershipOperation blocks invalid joins and removals", () => {
  const dupJoin = validateMembershipOperation({
    operation: "join",
    circleId: "circle-1",
    memberId: "member-1",
    existingMemberIds: ["member-1"],
  });
  const badRemove = validateMembershipOperation({
    operation: "remove",
    circleId: "circle-1",
    memberId: "member-2",
    existingMemberIds: ["member-1"],
  });

  assert.equal(dupJoin.ok, false);
  assert.equal(badRemove.ok, false);
});

test("sanitizeActivityFeed removes orphan activities/reactions and duplicate reactions", () => {
  const result = sanitizeActivityFeed({
    memberIds: ["m1", "m2"],
    activities: [
      { id: "a1", circle_id: "c1", member_id: "m1", event_type: "hit_30" },
      { id: "a2", circle_id: "c1", member_id: "missing", event_type: "hit_30" },
    ],
    reactions: [
      { activity_id: "a1", member_id: "m2", emoji: "fire" },
      { activity_id: "a1", member_id: "m2", emoji: "fire" },
      { activity_id: "a9", member_id: "m2", emoji: "clap" },
    ],
  });

  assert.equal(result.activities.length, 1);
  assert.equal(result.reactions.length, 1);
  assert.ok(result.discrepancies.length >= 2);
});
