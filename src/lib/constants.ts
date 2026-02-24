import {
  Cherry,
  LeafyGreen,
  Wheat,
  Bean,
  Nut,
  Sprout,
  Leaf,
  Flame,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";

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

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  All: LayoutGrid,
  Fruits: Cherry,
  Vegetables: LeafyGreen,
  "Whole Grains": Wheat,
  Legumes: Bean,
  Nuts: Nut,
  Seeds: Sprout,
  Herbs: Leaf,
  Spices: Flame,
};

export const CATEGORY_ILLUSTRATIONS: Record<string, string> = {
  Fruits: "/illustrations/library/cherries.png",
  Vegetables: "/illustrations/library/beetroot.png",
  "Whole Grains": "/illustrations/library/wheat.png",
  Legumes: "/illustrations/library/broad-bean.png",
  Nuts: "/illustrations/library/walnut.png",
  Seeds: "/illustrations/library/sunflower.png",
  Herbs: "/illustrations/library/basil.png",
  Spices: "/illustrations/library/ginger.png",
};

export const CATEGORY_GALLERY: Record<string, string[]> = {
  Fruits: [
    "/illustrations/library/cherries.png",
    "/illustrations/library/apples.png",
    "/illustrations/library/oranges.png",
    "/illustrations/library/pears.png",
    "/illustrations/library/blackberries.png",
    "/illustrations/library/strawberry.png",
  ],
  Vegetables: [
    "/illustrations/library/beetroot.png",
    "/illustrations/library/asparagus.png",
    "/illustrations/library/fennel.png",
    "/illustrations/library/radishes.png",
    "/illustrations/library/peas.png",
  ],
  "Whole Grains": [
    "/illustrations/library/wheat.png",
    "/illustrations/library/oats.png",
    "/illustrations/library/rice.png",
    "/illustrations/library/corn.png",
  ],
  Legumes: [
    "/illustrations/library/broad-bean.png",
    "/illustrations/library/chickpea.png",
    "/illustrations/library/lentil.png",
    "/illustrations/library/runner-bean.png",
  ],
  Nuts: [
    "/illustrations/library/walnut.png",
    "/illustrations/library/almond.png",
    "/illustrations/library/chestnut.png",
    "/illustrations/library/hazelnut.png",
  ],
  Seeds: [
    "/illustrations/library/sunflower.png",
    "/illustrations/library/pumpkin.png",
    "/illustrations/library/flax.png",
    "/illustrations/library/poppy.png",
  ],
  Herbs: [
    "/illustrations/library/basil.png",
    "/illustrations/library/rosemary.png",
    "/illustrations/library/sage.png",
    "/illustrations/library/thyme.png",
    "/illustrations/library/lavender.png",
  ],
  Spices: [
    "/illustrations/library/ginger.png",
    "/illustrations/library/turmeric.png",
    "/illustrations/library/cinnamon.png",
    "/illustrations/library/vanilla.png",
    "/illustrations/library/black-pepper.png",
  ],
};

export const ALL_ILLUSTRATIONS = [
  "/illustrations/library/strawberry.png",
  "/illustrations/library/beetroot.png",
  "/illustrations/library/wheat.png",
  "/illustrations/library/broad-bean.png",
  "/illustrations/library/walnut.png",
  "/illustrations/library/sunflower.png",
  "/illustrations/library/basil.png",
  "/illustrations/library/ginger.png",
  "/illustrations/library/cherries.png",
  "/illustrations/library/asparagus.png",
  "/illustrations/library/oats.png",
  "/illustrations/library/chickpea.png",
  "/illustrations/library/almond.png",
  "/illustrations/library/pumpkin.png",
  "/illustrations/library/rosemary.png",
  "/illustrations/library/turmeric.png",
  "/illustrations/library/oranges.png",
  "/illustrations/library/fennel.png",
  "/illustrations/library/corn.png",
  "/illustrations/library/lentil.png",
  "/illustrations/library/hazelnut.png",
  "/illustrations/library/flax.png",
  "/illustrations/library/sage.png",
  "/illustrations/library/cinnamon.png",
];

export const PARADE_ILLUSTRATIONS = [
  "/illustrations/library/sunflower.png",
  "/illustrations/library/cherries.png",
  "/illustrations/library/beetroot.png",
  "/illustrations/library/basil.png",
  "/illustrations/library/wheat.png",
  "/illustrations/library/walnut.png",
  "/illustrations/library/ginger.png",
  "/illustrations/library/strawberry.png",
  "/illustrations/library/asparagus.png",
  "/illustrations/library/oats.png",
  "/illustrations/library/chickpea.png",
  "/illustrations/library/almond.png",
  "/illustrations/library/pumpkin.png",
  "/illustrations/library/rosemary.png",
  "/illustrations/library/turmeric.png",
  "/illustrations/library/oranges.png",
  "/illustrations/library/corn.png",
  "/illustrations/library/lentil.png",
  "/illustrations/library/hazelnut.png",
  "/illustrations/library/flax.png",
  "/illustrations/library/sage.png",
  "/illustrations/library/cinnamon.png",
  "/illustrations/library/pears.png",
  "/illustrations/library/vanilla.png",
];

export const CATEGORY_ORDER = CATEGORIES.filter(
  (c): c is Exclude<Category, "All"> => c !== "All"
);

export const MEMBER_EMOJIS = [
  "🌱", "🌿", "🍀", "🌻", "🌸", "🌺", "🍄", "🌈",
  "⭐", "🦋", "🐢", "🦊", "🐻", "🐰", "🦁", "🐸",
];

export const TIPS = [
  "Each unique plant species you eat in a week earns points — fruits, veggies, grains, legumes, nuts, and seeds earn 1 point each.",
  "Herbs and spices earn 1/4 point each. A well-spiced curry can contribute 1-2 full points from seasonings alone.",
  "Your plant count resets every Sunday. Eating the same plant twice in one week still counts as 1 point.",
  "Different lentil types (red, green, brown) count separately — they have distinct nutritional profiles.",
  "Red, green, and yellow bell peppers are the same species at different ripeness stages — they count as 1 point total.",
  "Tofu, tempeh, and edamame all come from soybeans — that's 1 soy point total, not 3.",
  "Coffee and tea each count as 1 point — they come from distinct plant species.",
  "Dark chocolate (>70% cacao) counts as 1 point. The cacao bean is a minimally processed plant.",
  "Frozen vegetables fully count — flash-freezing retains nutrients. Stock your freezer for easy variety.",
  "A single well-designed breakfast can deliver 5-8 plant points. Try overnight oats with fruit, seeds, and nuts.",
  "Popcorn counts! It's a whole grain (corn/maize) — 1 full point. Air-popped or lightly prepared is best.",
  "Peanuts are botanically a legume, not a nut. They count as 1 point under legumes.",
  "Nut butters and seed butters count — peanut butter = 1 point (legume), tahini = 1 point (sesame seed).",
  "Plant-based milks count for their base plant. But don't double-count: almond milk + whole almonds = 1 almond point.",
  "Fermented plants like kimchi and sauerkraut count for the base vegetable AND add probiotic benefits.",
  "People who eat 30+ plants per week have significantly more diverse gut bacteria, according to the American Gut Project.",
  "Gut microbial diversity is linked to stronger immunity, better mental health, improved metabolism, and reduced inflammation.",
  "Going from 10 plants to 20 per week is a bigger health win than going from 25 to 30. Progress over perfection.",
  "The Spice Rack Hack: using 4-8 different spices daily adds 1-2 points per day. That's 7-10+ points per week from spices alone.",
  "Buy pre-mixed bags — mixed salad greens, trail mix, frozen stir-fry blends. Each component counts individually.",
  "Instead of rice every day, rotate through oats, quinoa, barley, farro, buckwheat, millet, and brown rice. That's 7 grain points.",
  "Add a \"topping tax\" to every meal — a handful of seeds, nuts, or fresh herbs. Adds 2-4 points daily without changing your meals.",
  "White rice, white flour, and refined sugar don't count. The plant must be in a whole or minimally processed form.",
  "Coconut is technically a fruit (a drupe) — it counts as 1 plant point.",
  "A single smoothie can contain 6-10 different plants. It's one of the most efficient delivery methods for plant diversity.",
  "Same plant, different parts (beet root vs beet greens) = 1 point total. The point is tied to the species.",
  "If you have IBS, the challenge still works — use small amounts of many plants rather than large amounts of a few.",
  "Olive oil doesn't count (it's an extracted oil), but whole olives do count as 1 point.",
  "Mixed spice blends: count each identifiable component spice as 1/4 point. Can't identify them? Count the blend as 1/2 point total.",
  "A bag of 15-bean soup mix costs a few dollars and contains 15 different legume points. Budget-friendly diversity.",
];
