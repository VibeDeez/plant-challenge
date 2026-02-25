import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeRedirectPath } from "./redirect.ts";

test("allows valid in-app relative paths", () => {
  assert.equal(
    sanitizeRedirectPath("/profile?tab=settings#security"),
    "/profile?tab=settings#security"
  );
});

test("missing next path falls back to root", () => {
  assert.equal(sanitizeRedirectPath(null), "/");
  assert.equal(sanitizeRedirectPath(""), "/");
});

test("rejects external absolute URLs", () => {
  assert.equal(sanitizeRedirectPath("https://evil.example/steal"), "/");
  assert.equal(sanitizeRedirectPath("javascript:alert(1)"), "/");
});

test("rejects protocol-relative URLs", () => {
  assert.equal(sanitizeRedirectPath("//evil.example/path"), "/");
});

test("rejects malformed or encoded dangerous paths", () => {
  assert.equal(sanitizeRedirectPath("/%2F%2Fevil.example/path"), "/");
  assert.equal(sanitizeRedirectPath("/%E0%A4%A"), "/");
});
