import assert from "node:assert/strict";
import test from "node:test";
import {
  isDestructiveClassName,
  isDestructiveLabel,
  resolveIntentFromDataAttribute,
} from "./resolveInteraction.ts";

test("resolveIntentFromDataAttribute returns known haptic intents", () => {
  assert.equal(resolveIntentFromDataAttribute("light"), "light");
  assert.equal(resolveIntentFromDataAttribute("selection"), "selection");
  assert.equal(resolveIntentFromDataAttribute("warning"), "warning");
  assert.equal(resolveIntentFromDataAttribute("off"), "off");
});

test("resolveIntentFromDataAttribute normalizes whitespace and case", () => {
  assert.equal(resolveIntentFromDataAttribute(" Selection "), "selection");
  assert.equal(resolveIntentFromDataAttribute("ERROR"), "error");
});

test("resolveIntentFromDataAttribute ignores unknown values", () => {
  assert.equal(resolveIntentFromDataAttribute(""), null);
  assert.equal(resolveIntentFromDataAttribute("custom"), null);
  assert.equal(resolveIntentFromDataAttribute(undefined), null);
});

test("destructive intent helpers catch destructive labels and classes", () => {
  assert.equal(isDestructiveLabel("Delete member"), true);
  assert.equal(isDestructiveLabel("Sign Out"), true);
  assert.equal(isDestructiveLabel("Save"), false);

  assert.equal(isDestructiveClassName("text-red-600"), true);
  assert.equal(isDestructiveClassName("hover:bg-red-50"), true);
  assert.equal(isDestructiveClassName("text-brand-dark"), false);
});
