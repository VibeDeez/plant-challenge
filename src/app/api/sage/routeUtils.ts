import type { SageContext } from "../../../lib/ai/sageRules";

const DEFAULT_TIMEOUT_MS = 12_000;
const MIN_TIMEOUT_MS = 1_000;
const MAX_TIMEOUT_MS = 60_000;
const MAX_QUESTION_LENGTH = 500;
const MAX_CONTEXT_LIST_ITEMS = 100;
const MAX_CONTEXT_STRING_LENGTH = 120;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function hasTooLongStringItems(values: string[]): boolean {
  return values.some((item) => item.length > MAX_CONTEXT_STRING_LENGTH);
}

export function parseSageTimeoutMs(rawValue: string | undefined): number {
  if (!rawValue) return DEFAULT_TIMEOUT_MS;
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) return DEFAULT_TIMEOUT_MS;
  const rounded = Math.round(parsed);
  if (rounded < MIN_TIMEOUT_MS) return MIN_TIMEOUT_MS;
  if (rounded > MAX_TIMEOUT_MS) return MAX_TIMEOUT_MS;
  return rounded;
}

export function getSageRequestLimitError(
  question: string,
  context?: SageContext
): string | null {
  if (question.trim().length > MAX_QUESTION_LENGTH) {
    return `question exceeds max length of ${MAX_QUESTION_LENGTH} characters`;
  }

  if (!context) return null;

  if (
    context.alreadyLoggedThisWeek &&
    context.alreadyLoggedThisWeek.length > MAX_CONTEXT_LIST_ITEMS
  ) {
    return `context.alreadyLoggedThisWeek exceeds max size of ${MAX_CONTEXT_LIST_ITEMS}`;
  }

  if (
    context.alreadyLoggedThisWeek &&
    hasTooLongStringItems(context.alreadyLoggedThisWeek)
  ) {
    return `context.alreadyLoggedThisWeek items exceed max length of ${MAX_CONTEXT_STRING_LENGTH} characters`;
  }

  if (
    context.recognizedPlants &&
    context.recognizedPlants.length > MAX_CONTEXT_LIST_ITEMS
  ) {
    return `context.recognizedPlants exceeds max size of ${MAX_CONTEXT_LIST_ITEMS}`;
  }

  if (context.recognizedPlants) {
    for (const plant of context.recognizedPlants) {
      if (plant.name.length > MAX_CONTEXT_STRING_LENGTH) {
        return `context.recognizedPlants.name exceeds max length of ${MAX_CONTEXT_STRING_LENGTH} characters`;
      }
      if (
        plant.category &&
        plant.category.length > MAX_CONTEXT_STRING_LENGTH
      ) {
        return `context.recognizedPlants.category exceeds max length of ${MAX_CONTEXT_STRING_LENGTH} characters`;
      }
    }
  }

  return null;
}

export function extractModelMessageContent(payload: unknown): string | null {
  if (!isRecord(payload)) return null;
  const choices = payload.choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;
  const first = choices[0];
  if (!isRecord(first)) return null;
  const message = first.message;
  if (!isRecord(message)) return null;
  return typeof message.content === "string" ? message.content : null;
}
