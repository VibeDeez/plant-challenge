import type { MenuMaxLogCandidate, MenuMaxRecommendation } from "./menuMaxTypes";

const ALIAS_MAP = {
  coffee: [
    "coffee",
    "espresso",
    "americano",
    "cappuccino",
    "latte",
    "cold brew",
    "drip coffee",
    "iced coffee",
  ],
  tea: [
    "tea",
    "green tea",
    "black tea",
    "herbal tea",
    "oolong",
    "chai",
    "matcha",
    "iced tea",
  ],
  bell_pepper: [
    "bell pepper",
    "capsicum",
    "red bell pepper",
    "green bell pepper",
    "yellow bell pepper",
    "orange bell pepper",
  ],
};

const ENTITY_MAP: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

export const MAX_MENU_SOURCE_TEXT_LENGTH = 12_000;

export function extractVisibleTextFromHtml(html: string): string {
  const withoutScripts = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");

  const withoutTags = withoutScripts.replace(/<[^>]+>/g, " ");
  const decoded = Object.entries(ENTITY_MAP).reduce(
    (acc, [entity, value]) => acc.split(entity).join(value),
    withoutTags
  );

  return decoded.replace(/\s+/g, " ").trim();
}

export function trimSourceText(text: string, maxLength = MAX_MENU_SOURCE_TEXT_LENGTH): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

export function isValidMenuImageDataUrl(value: string): boolean {
  return /^data:image\/[a-zA-Z0-9.+-]+;base64,[a-zA-Z0-9+/=\s]+$/.test(value);
}

export function clampConfidence(confidence: number): number {
  if (Number.isNaN(confidence)) return 0.45;
  if (confidence < 0) return 0;
  if (confidence > 1) return 1;
  return confidence;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAlias(text: string, aliases: string[]): boolean {
  return aliases.some((alias) => {
    const normalizedAlias = normalizeText(alias);
    return new RegExp(`\\b${normalizedAlias.replace(/\s+/g, "\\s+")}\\b`).test(
      text
    );
  });
}

function normalizeSpeciesName(name: string): string {
  const normalized = normalizeText(name);
  if (hasAlias(normalized, ALIAS_MAP.bell_pepper)) return "bell_pepper";
  if (hasAlias(normalized, ALIAS_MAP.coffee)) return "coffee";
  if (hasAlias(normalized, ALIAS_MAP.tea)) return "tea";
  return normalized;
}

export function mergeLogCandidates(
  recommendations: MenuMaxRecommendation[]
): MenuMaxLogCandidate[] {
  const merged = new Map<string, MenuMaxLogCandidate>();

  for (const recommendation of recommendations) {
    for (const plant of recommendation.plants) {
      const canonical = normalizeSpeciesName(plant.name);
      const existing = merged.get(canonical);
      if (existing) {
        if (!existing.sourceDishes.includes(recommendation.dishName)) {
          existing.sourceDishes.push(recommendation.dishName);
        }
        if (!existing.duplicateThisWeek && plant.duplicateThisWeek) {
          existing.duplicateThisWeek = true;
        }
        continue;
      }

      merged.set(canonical, {
        ...plant,
        sourceDishes: [recommendation.dishName],
      });
    }
  }

  return Array.from(merged.values());
}
