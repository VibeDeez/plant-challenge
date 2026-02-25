import assert from "node:assert/strict";
import test from "node:test";
import {
  isValidCircleId,
  validateJoinCirclePayload,
} from "./circles.ts";

test("isValidCircleId rejects undefined-like path segments", () => {
  assert.equal(isValidCircleId("undefined"), false);
  assert.equal(isValidCircleId("null"), false);
  assert.equal(isValidCircleId(""), false);
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
