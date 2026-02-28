export const RECOGNITION_LOW_CONFIDENCE_THRESHOLD = 0.72;

export type RecognitionConfidenceBucket = "high" | "low";

export function normalizeRecognitionConfidence(value: unknown): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 0.55;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export function getRecognitionConfidenceBucket(confidence: number): RecognitionConfidenceBucket {
  return confidence < RECOGNITION_LOW_CONFIDENCE_THRESHOLD ? "low" : "high";
}

export function requiresConfidenceReview(confidence: number): boolean {
  return getRecognitionConfidenceBucket(confidence) === "low";
}
