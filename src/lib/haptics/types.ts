import type { HapticInput } from "web-haptics";

export const HAPTIC_INTENTS = [
  "light",
  "selection",
  "warning",
  "success",
  "error",
  "off",
] as const;

export type HapticIntent = (typeof HAPTIC_INTENTS)[number];

export const HAPTICS_DEFAULT_TAP_INTENT: HapticIntent = "light";

export function isHapticIntent(value: string | null | undefined): value is HapticIntent {
  return HAPTIC_INTENTS.includes(value as HapticIntent);
}

export function normalizeHapticInput(input?: HapticIntent | HapticInput): HapticInput | null {
  if (input === undefined || input === null) {
    return HAPTICS_DEFAULT_TAP_INTENT;
  }

  if (typeof input === "string") {
    const normalized = input.trim();
    if (!normalized) return HAPTICS_DEFAULT_TAP_INTENT;
    if (normalized === "off") return null;
    return normalized;
  }

  return input;
}
