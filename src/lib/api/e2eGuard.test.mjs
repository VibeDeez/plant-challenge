import assert from "node:assert/strict";
import test from "node:test";
import { isE2ERouteBlocked } from "./e2eGuard.ts";

test("blocks e2e routes in production regardless of E2E_TEST", () => {
  assert.equal(
    isE2ERouteBlocked({ nodeEnv: "production", e2eTest: "true" }),
    true
  );
  assert.equal(
    isE2ERouteBlocked({ nodeEnv: "production", e2eTest: "false" }),
    true
  );
});

test("allows e2e routes only when not production and E2E_TEST=true", () => {
  assert.equal(
    isE2ERouteBlocked({ nodeEnv: "development", e2eTest: "true" }),
    false
  );
  assert.equal(isE2ERouteBlocked({ nodeEnv: "test", e2eTest: "false" }), true);
  assert.equal(isE2ERouteBlocked({ nodeEnv: "test", e2eTest: undefined }), true);
});
