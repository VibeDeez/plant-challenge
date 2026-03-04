export const HAPTICS_ENABLED_STORAGE_KEY = "plantmaxxing.haptics.enabled";
export const HAPTICS_DEFAULT_ENABLED = true;

export function parseStoredHapticsEnabled(
  value: string | null | undefined
): boolean {
  if (value === "true") return true;
  if (value === "false") return false;
  return HAPTICS_DEFAULT_ENABLED;
}

export function serializeHapticsEnabled(enabled: boolean): "true" | "false" {
  return enabled ? "true" : "false";
}
