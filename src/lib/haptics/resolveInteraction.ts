import type { HapticInput } from "web-haptics";

type HapticIntent = "light" | "selection" | "warning" | "success" | "error" | "off";

const HAPTICS_DEFAULT_TAP_INTENT: HapticIntent = "light";
const DATA_HAPTIC_INTENTS = new Set<HapticIntent>([
  "light",
  "selection",
  "warning",
  "success",
  "error",
  "off",
]);

const DESTRUCTIVE_LABEL_PATTERNS = [
  "delete",
  "remove",
  "revoke",
  "sign out",
  "log out",
  "logout",
  "wipe",
  "destroy",
];

const DESTRUCTIVE_CLASS_PATTERNS = [
  "text-red",
  "bg-red",
  "border-red",
  "hover:bg-red",
  "hover:text-red",
];

const SELECTION_ROLES = new Set([
  "tab",
  "switch",
  "radio",
  "menuitemradio",
  "option",
]);

const INTERACTIVE_SELECTOR = [
  "[data-haptic]",
  "[data-haptic-pattern]",
  "button",
  "a[href]",
  "summary",
  "input[type='button']",
  "input[type='submit']",
  "input[type='reset']",
  "[role='button']",
  "[role='tab']",
  "[role='switch']",
  "[role='radio']",
  "[role='menuitemradio']",
  "[role='option']",
].join(", ");

export function findHapticTarget(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  const closest = target.closest(INTERACTIVE_SELECTOR);
  return closest instanceof HTMLElement ? closest : null;
}

export function isSubmitControl(
  element: HTMLElement | null
): element is HTMLButtonElement | HTMLInputElement {
  if (!element) return false;

  if (element instanceof HTMLButtonElement) {
    if (element.type === "submit") return true;
    return !element.hasAttribute("type") && !!element.form;
  }

  if (element instanceof HTMLInputElement) {
    return element.type === "submit" || element.type === "image";
  }

  return false;
}

export function resolveHapticInputForElement(
  element: HTMLElement | null,
  fallbackIntent: HapticIntent = HAPTICS_DEFAULT_TAP_INTENT
): HapticInput | null {
  if (!element || isDisabledElement(element)) return null;

  const overrideHost = element.closest("[data-haptic], [data-haptic-pattern]");
  if (overrideHost instanceof HTMLElement) {
    const attrIntent = resolveIntentFromDataAttribute(overrideHost.dataset.haptic);
    if (attrIntent === "off") return null;

    const attrPattern = overrideHost.dataset.hapticPattern?.trim();
    if (attrPattern) return attrPattern;

    if (attrIntent) return attrIntent;
  }

  const role = element.getAttribute("role")?.toLowerCase();
  if (
    (role && SELECTION_ROLES.has(role)) ||
    element.getAttribute("aria-selected") === "true" ||
    element.hasAttribute("aria-pressed")
  ) {
    return "selection";
  }

  const label = [
    element.getAttribute("aria-label") ?? "",
    element.textContent ?? "",
  ]
    .join(" ")
    .trim();
  if (isDestructiveLabel(label) || isDestructiveClassName(element.className)) {
    return "warning";
  }

  return fallbackIntent;
}

export function resolveIntentFromDataAttribute(
  value: string | null | undefined
): HapticIntent | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return DATA_HAPTIC_INTENTS.has(normalized as HapticIntent)
    ? (normalized as HapticIntent)
    : null;
}

export function isDestructiveLabel(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  return DESTRUCTIVE_LABEL_PATTERNS.some((keyword) =>
    normalized.includes(keyword)
  );
}

export function isDestructiveClassName(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  return DESTRUCTIVE_CLASS_PATTERNS.some((keyword) =>
    normalized.includes(keyword)
  );
}

function isDisabledElement(element: HTMLElement): boolean {
  if (element.getAttribute("aria-disabled") === "true") return true;

  if ("disabled" in element) {
    const withDisabled = element as HTMLButtonElement | HTMLInputElement;
    if (typeof withDisabled.disabled === "boolean" && withDisabled.disabled) {
      return true;
    }
  }

  const disabledAncestor = element.closest("[aria-disabled='true']");
  return disabledAncestor instanceof HTMLElement;
}
