export type SageVerdict =
  | "counts"
  | "partial"
  | "does_not_count"
  | "duplicate_week"
  | "uncertain";

export type SageContext = {
  alreadyLoggedThisWeek?: string[];
  recognizedPlants?: { name: string; category?: string; points?: number }[];
  weekProgress?: { points?: number; uniquePlants?: number; target?: number };
};

export type SageResponse = {
  answer: string;
  verdict: SageVerdict;
  points: number | null;
  reason: string;
  confidence: number;
  followUpQuestion?: string;
};

type DeterministicRuleId =
  | "coffee_quarter_point"
  | "tea_quarter_point"
  | "bell_pepper_same_species"
  | "duplicate_species_week";

export type DeterministicSageResult = {
  matched: true;
  ruleId: DeterministicRuleId;
  canonicalSpecies?: string;
  response: SageResponse;
};

const ALIAS_MAP: Record<string, string[]> = {
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

const DUPLICATE_HINTS = [
  "already logged",
  "already had",
  "again this week",
  "same week",
  "duplicate",
  "second time",
  "another one",
  "log it again",
];

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

function isDuplicateInWeek(
  canonicalSpecies: string,
  context?: SageContext
): boolean {
  if (!context) return false;
  const logged = context.alreadyLoggedThisWeek ?? [];
  const recognized = context.recognizedPlants?.map((p) => p.name) ?? [];
  const allKnown = [...logged, ...recognized].map(normalizeSpeciesName);
  return allKnown.includes(canonicalSpecies);
}

function duplicateResponse(
  canonicalSpecies: string,
  reasonPrefix: string
): DeterministicSageResult {
  return {
    matched: true,
    ruleId: "duplicate_species_week",
    canonicalSpecies,
    response: {
      answer:
        "This is a duplicate species for the current week, so it does not add a new unique weekly point.",
      verdict: "duplicate_week",
      points: 0,
      reason: `${reasonPrefix} Duplicate species in the same week should not add a new unique point.`,
      confidence: 1,
    },
  };
}

export function getSageDeterministicAliases(): Record<string, string[]> {
  return ALIAS_MAP;
}

export function matchDeterministicSageRule(
  question: string,
  context?: SageContext
): DeterministicSageResult | null {
  const normalizedQuestion = normalizeText(question);
  const asksAboutDuplicate = DUPLICATE_HINTS.some((hint) =>
    normalizedQuestion.includes(normalizeText(hint))
  );

  if (hasAlias(normalizedQuestion, ALIAS_MAP.coffee)) {
    if (isDuplicateInWeek("coffee", context) || asksAboutDuplicate) {
      return duplicateResponse(
        "coffee",
        "Coffee was already logged as the same species this week."
      );
    }
    return {
      matched: true,
      ruleId: "coffee_quarter_point",
      canonicalSpecies: "coffee",
      response: {
        answer: "Coffee counts as 0.25 points.",
        verdict: "counts",
        points: 0.25,
        reason: "Deterministic rule: coffee counts as 0.25 points.",
        confidence: 1,
      },
    };
  }

  if (hasAlias(normalizedQuestion, ALIAS_MAP.tea)) {
    if (isDuplicateInWeek("tea", context) || asksAboutDuplicate) {
      return duplicateResponse(
        "tea",
        "Tea was already logged as the same species this week."
      );
    }
    return {
      matched: true,
      ruleId: "tea_quarter_point",
      canonicalSpecies: "tea",
      response: {
        answer: "Tea counts as 0.25 points.",
        verdict: "counts",
        points: 0.25,
        reason: "Deterministic rule: tea counts as 0.25 points.",
        confidence: 1,
      },
    };
  }

  if (hasAlias(normalizedQuestion, ALIAS_MAP.bell_pepper)) {
    if (isDuplicateInWeek("bell_pepper", context) || asksAboutDuplicate) {
      return duplicateResponse(
        "bell_pepper",
        "Bell pepper color variants are the same species."
      );
    }
    return {
      matched: true,
      ruleId: "bell_pepper_same_species",
      canonicalSpecies: "bell_pepper",
      response: {
        answer:
          "Bell pepper color variants (red, green, yellow) are the same species and count as one unique weekly point total.",
        verdict: "counts",
        points: 1,
        reason:
          "Deterministic rule: bell pepper color variants are one species, so only one unique weekly point applies.",
        confidence: 1,
      },
    };
  }

  if (asksAboutDuplicate) {
    return {
      matched: true,
      ruleId: "duplicate_species_week",
      response: {
        answer:
          "Duplicate species in the same week do not add a new unique weekly point.",
        verdict: "duplicate_week",
        points: 0,
        reason:
          "Deterministic rule: duplicate species in the same week should not add new unique point.",
        confidence: 1,
      },
    };
  }

  return null;
}
