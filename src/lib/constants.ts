export const CATEGORIES = [
  "All",
  "Fruits",
  "Vegetables",
  "Whole Grains",
  "Legumes",
  "Nuts",
  "Seeds",
  "Herbs",
  "Spices",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_COLORS: Record<string, string> = {
  Fruits: "#ef4444",        // red
  Vegetables: "#22c55e",    // green
  "Whole Grains": "#f59e0b", // amber
  Legumes: "#a855f7",       // purple
  Nuts: "#f97316",          // orange
  Seeds: "#06b6d4",         // cyan
  Herbs: "#10b981",         // emerald
  Spices: "#e11d48",        // rose
};

export const CATEGORY_EMOJI: Record<string, string> = {
  Fruits: "🍎",
  Vegetables: "🥦",
  "Whole Grains": "🌾",
  Legumes: "🫘",
  Nuts: "🥜",
  Seeds: "🌻",
  Herbs: "🌿",
  Spices: "🧂",
};

export const MEMBER_EMOJIS = [
  "🌱", "🌿", "🍀", "🌻", "🌸", "🌺", "🍄", "🌈",
  "⭐", "🦋", "🐢", "🦊", "🐻", "🐰", "🦁", "🐸",
];
