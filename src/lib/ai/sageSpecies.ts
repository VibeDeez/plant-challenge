export type SageSpeciesContext = {
  alreadyLoggedThisWeek?: string[];
  recognizedPlants?: { name: string }[];
};

export const SAGE_ALIAS_MAP = {
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
} as const;

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function hasAlias(text: string, aliases: readonly string[]): boolean {
  return aliases.some((alias) => {
    const normalizedAlias = normalizeText(alias);
    return new RegExp(`\\b${normalizedAlias.replace(/\s+/g, "\\s+")}\\b`).test(
      text
    );
  });
}

export function normalizeSpeciesName(name: string): string {
  const normalized = normalizeText(name);
  if (hasAlias(normalized, SAGE_ALIAS_MAP.bell_pepper)) return "bell_pepper";
  if (hasAlias(normalized, SAGE_ALIAS_MAP.coffee)) return "coffee";
  if (hasAlias(normalized, SAGE_ALIAS_MAP.tea)) return "tea";
  return normalized;
}

export function isDuplicateSpeciesInWeek(
  canonicalSpecies: string,
  context?: SageSpeciesContext
): boolean {
  if (!context) return false;
  const logged = context.alreadyLoggedThisWeek ?? [];
  const recognized = context.recognizedPlants?.map((plant) => plant.name) ?? [];
  const allKnown = [...logged, ...recognized].map(normalizeSpeciesName);
  return allKnown.includes(canonicalSpecies);
}
