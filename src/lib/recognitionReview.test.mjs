import assert from "node:assert/strict";
import test from "node:test";
import {
  RECOGNITION_LOW_CONFIDENCE_THRESHOLD,
  normalizeRecognitionConfidence,
  requiresConfidenceReview,
} from "./recognitionReview.ts";

test("normalizes out-of-range confidence", () => {
  assert.equal(normalizeRecognitionConfidence(-1), 0);
  assert.equal(normalizeRecognitionConfidence(2), 1);
  assert.equal(normalizeRecognitionConfidence(Number.NaN), 0.55);
});

test("flags low-confidence predictions for review", () => {
  assert.equal(requiresConfidenceReview(RECOGNITION_LOW_CONFIDENCE_THRESHOLD - 0.01), true);
  assert.equal(requiresConfidenceReview(RECOGNITION_LOW_CONFIDENCE_THRESHOLD), false);
});
