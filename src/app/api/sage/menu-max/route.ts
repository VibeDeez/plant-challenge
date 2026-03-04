import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import {
  getOpenRouterClient,
  isOpenRouterAbortError,
} from "../../../../lib/ai/openrouterClient";
import type {
  MenuMaxContext,
  MenuMaxRecommendation,
  MenuMaxResponse,
} from "../../../../lib/ai/menuMaxTypes";
import {
  clampConfidence,
  extractVisibleTextFromHtml,
  isValidMenuImageDataUrl,
  mergeLogCandidates,
  trimSourceText,
} from "../../../../lib/ai/menuMaxUtils";
import {
  isDuplicateSpeciesInWeek,
  normalizeSpeciesName,
} from "../../../../lib/ai/sageSpecies";
import {
  extractModelMessageContent,
  parseSageTimeoutMs,
} from "../routeUtils";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MENU_MAX_MODEL =
  process.env.SAGE_MENU_OPENROUTER_MODEL ?? "google/gemini-2.0-flash-lite-001";
const REQUEST_TIMEOUT_MS = parseSageTimeoutMs(process.env.SAGE_MENU_TIMEOUT_MS);

const MAX_URL_LENGTH = 500;
const MAX_QUERY_LENGTH = 220;
const MAX_IMAGE_DATA_URL_LENGTH = 4 * 1024 * 1024;
const MAX_CONTEXT_ITEMS = 120;
const MAX_DISCOVER_RESULTS = 5;
const MAX_DISCOVER_SOURCES = 4;
const MAX_SOURCE_TEXT_FOR_MODEL = 3200;

type ModelRecommendation = {
  dishName: string;
  why: string;
  plants: { name: string; category?: string }[];
  sourceUrl?: string;
  sourceTitle?: string;
};

type PlantRow = {
  name: string;
  category: string;
  points: number;
};

type RecipeSearchHit = {
  title: string;
  url: string;
};

type RecipeSource = {
  title: string;
  url: string;
  text: string;
};

const MODEL_SYSTEM_PROMPT = `You are Menu Max for Plantmaxxing.

Goal:
- Analyze menu or recipe sources and return the best high-diversity plant-forward picks.
- Focus on realistic recipes/dishes users could make or order.

Rules:
- Return exactly 3 recommendations.
- Use concise plain language.
- For each recommendation include identifiable plant ingredients.
- Categories must be one of: Fruits, Vegetables, Whole Grains, Legumes, Nuts, Seeds, Herbs, Spices.
- If uncertain about a plant category, still include the plant and provide your best category guess.
- If sources are provided, only use those sources.

Return ONLY JSON in this exact shape:
{
  "recommendations": [
    {
      "dishName": "string",
      "why": "string",
      "sourceUrl": "string (optional)",
      "sourceTitle": "string (optional)",
      "plants": [{"name":"string","category":"string"}]
    }
  ],
  "confidence": 0.0,
  "sourceNotes": ["string"]
}`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isValidMenuContext(value: unknown): value is MenuMaxContext {
  if (value === undefined) return true;
  if (!isRecord(value)) return false;

  if (value.alreadyLoggedThisWeek !== undefined) {
    if (
      !Array.isArray(value.alreadyLoggedThisWeek) ||
      value.alreadyLoggedThisWeek.length > MAX_CONTEXT_ITEMS ||
      !value.alreadyLoggedThisWeek.every((item) => typeof item === "string")
    ) {
      return false;
    }
  }

  if (value.weekProgress !== undefined) {
    if (!isRecord(value.weekProgress)) return false;
    const { points, uniquePlants, target } = value.weekProgress;
    if (points !== undefined && typeof points !== "number") return false;
    if (uniquePlants !== undefined && typeof uniquePlants !== "number") return false;
    if (target !== undefined && typeof target !== "number") return false;
  }

  return true;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function decodeHtmlEntities(raw: string): string {
  return raw
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}

function stripHtmlTags(raw: string): string {
  return raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function resolveDuckDuckGoTarget(href: string): string | null {
  try {
    if (href.startsWith("//")) {
      href = `https:${href}`;
    }
    if (href.startsWith("/")) {
      href = new URL(href, "https://duckduckgo.com").toString();
    }

    const parsed = new URL(href);
    if (parsed.hostname.includes("duckduckgo.com") && parsed.pathname.startsWith("/l/")) {
      const redirected = parsed.searchParams.get("uddg");
      if (!redirected) return null;
      const decoded = decodeURIComponent(redirected);
      return isValidHttpUrl(decoded) ? decoded : null;
    }

    return isValidHttpUrl(parsed.toString()) ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function extractDuckDuckGoResults(html: string): RecipeSearchHit[] {
  const results: RecipeSearchHit[] = [];
  const seen = new Set<string>();
  const regex = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const resolvedUrl = resolveDuckDuckGoTarget(match[1]);
    if (!resolvedUrl || seen.has(resolvedUrl)) continue;

    const title = decodeHtmlEntities(stripHtmlTags(match[2] ?? ""));
    if (!title) continue;

    seen.add(resolvedUrl);
    results.push({ title, url: resolvedUrl });
    if (results.length >= MAX_DISCOVER_RESULTS) break;
  }

  return results;
}

async function searchRecipeUrls(query: string): Promise<RecipeSearchHit[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const searchUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(
      `${query} recipe`
    )}`;
    const response = await fetch(searchUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Plantmaxxing Recipe Finder",
      },
    });

    if (!response.ok) return [];
    const html = await response.text();
    return extractDuckDuckGoResults(html);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchRecipeSource(hit: RecipeSearchHit): Promise<RecipeSource | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(hit.url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Plantmaxxing Recipe Finder",
      },
    });
    if (!response.ok) return null;

    const html = await response.text();
    const extracted = trimSourceText(
      extractVisibleTextFromHtml(html),
      MAX_SOURCE_TEXT_FOR_MODEL
    );
    if (extracted.length < 120) return null;

    return {
      title: hit.title,
      url: hit.url,
      text: extracted,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function parseModelMenuResponse(rawContent: string): {
  recommendations: ModelRecommendation[];
  confidence: number;
  sourceNotes: string[];
} | null {
  const candidate = rawContent
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    return null;
  }

  if (!isRecord(parsed)) return null;
  if (!Array.isArray(parsed.recommendations)) return null;
  if (typeof parsed.confidence !== "number") return null;

  const parsedRecommendations: ModelRecommendation[] = parsed.recommendations
    .map((item): ModelRecommendation | null => {
      if (!isRecord(item)) return null;
      if (typeof item.dishName !== "string" || item.dishName.trim().length === 0) {
        return null;
      }
      if (typeof item.why !== "string" || item.why.trim().length === 0) {
        return null;
      }
      if (!Array.isArray(item.plants)) return null;

      const plants = item.plants
        .map((plant): { name: string; category?: string } | null => {
          if (!isRecord(plant)) return null;
          if (typeof plant.name !== "string" || plant.name.trim().length === 0) {
            return null;
          }
          if (plant.category !== undefined && typeof plant.category !== "string") {
            return null;
          }
          return {
            name: plant.name.trim(),
            category: typeof plant.category === "string" ? plant.category.trim() : undefined,
          };
        })
        .filter((plant): plant is { name: string; category?: string } => Boolean(plant));

      if (plants.length === 0) return null;

      const sourceUrl =
        typeof item.sourceUrl === "string" && isValidHttpUrl(item.sourceUrl)
          ? item.sourceUrl
          : undefined;
      const sourceTitle =
        typeof item.sourceTitle === "string" && item.sourceTitle.trim().length > 0
          ? item.sourceTitle.trim()
          : undefined;

      return {
        dishName: item.dishName.trim(),
        why: item.why.trim(),
        plants,
        sourceUrl,
        sourceTitle,
      };
    })
    .filter((item): item is ModelRecommendation => Boolean(item))
    .slice(0, 3);

  if (parsedRecommendations.length === 0) return null;

  const sourceNotes = Array.isArray(parsed.sourceNotes)
    ? parsed.sourceNotes.filter((note): note is string => typeof note === "string")
    : [];

  return {
    recommendations: parsedRecommendations,
    confidence: clampConfidence(parsed.confidence),
    sourceNotes,
  };
}

function inferFallbackCategory(name: string): string {
  const lower = name.toLowerCase();
  if (/(bean|lentil|pea|chickpea)/.test(lower)) return "Legumes";
  if (/(rice|quinoa|barley|oat|farro|millet|buckwheat|wheat)/.test(lower)) {
    return "Whole Grains";
  }
  if (/(seed|sesame|chia|flax|sunflower|pumpkin)/.test(lower)) return "Seeds";
  if (/(walnut|almond|cashew|pecan|hazelnut|pistachio)/.test(lower)) return "Nuts";
  if (/(basil|parsley|cilantro|mint|oregano|rosemary|thyme)/.test(lower)) return "Herbs";
  if (/(pepper|turmeric|cumin|paprika|cinnamon|ginger)/.test(lower)) return "Spices";
  if (/(apple|banana|berry|orange|grape|mango|pear|peach|melon)/.test(lower)) {
    return "Fruits";
  }
  return "Vegetables";
}

function normalizeRecommendations(
  recommendations: ModelRecommendation[],
  plantMap: Map<string, PlantRow>,
  context?: MenuMaxContext
): MenuMaxRecommendation[] {
  return recommendations.slice(0, 3).map((recommendation, index) => {
    const seen = new Set<string>();
    const plants = recommendation.plants
      .map((plant) => {
        const canonical = normalizeSpeciesName(plant.name);
        if (seen.has(canonical)) return null;
        seen.add(canonical);

        const matched = plantMap.get(plant.name.toLowerCase());
        const category = matched?.category ?? plant.category ?? inferFallbackCategory(plant.name);
        const points =
          matched?.points ??
          (category === "Herbs" || category === "Spices" ? 0.25 : 1);
        const duplicateThisWeek = isDuplicateSpeciesInWeek(canonical, context);

        return {
          name: matched?.name ?? plant.name,
          category,
          points,
          matched: Boolean(matched),
          duplicateThisWeek,
        };
      })
      .filter(
        (
          plant
        ): plant is {
          name: string;
          category: string;
          points: number;
          matched: boolean;
          duplicateThisWeek: boolean;
        } => Boolean(plant)
      );

    const estimatedPoints = Number(
      plants
        .filter((plant) => !plant.duplicateThisWeek)
        .reduce((sum, plant) => sum + plant.points, 0)
        .toFixed(2)
    );
    const estimatedUniquePlants = plants.filter((plant) => !plant.duplicateThisWeek).length;

    return {
      rank: (index + 1) as 1 | 2 | 3,
      dishName: recommendation.dishName,
      estimatedPoints,
      estimatedUniquePlants,
      why: recommendation.why,
      plants,
      sourceUrl: recommendation.sourceUrl,
      sourceTitle: recommendation.sourceTitle,
    };
  });
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "Menu Max model is not configured" },
        { status: 500 }
      );
    }
    const openrouter = getOpenRouterClient();
    if (!openrouter) {
      return NextResponse.json(
        { error: "Menu Max model is not configured" },
        { status: 500 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!isRecord(body)) {
      return NextResponse.json({ error: "Request body must be an object" }, { status: 400 });
    }

    const mode = body.mode;
    const url = body.url;
    const imageDataUrl = body.imageDataUrl;
    const query = body.query;
    const context = body.context;

    if (mode !== "url" && mode !== "image" && mode !== "discover") {
      return NextResponse.json(
        { error: "mode must be 'url', 'image', or 'discover'" },
        { status: 400 }
      );
    }
    if (!isValidMenuContext(context)) {
      return NextResponse.json({ error: "Invalid context shape" }, { status: 400 });
    }

    const sourceNotes: string[] = [];
    let userMessageContent:
      | string
      | Array<
          | { type: "text"; text: string }
          | { type: "image_url"; image_url: { url: string } }
        >;

    if (mode === "url") {
      if (typeof url !== "string" || url.trim().length === 0) {
        return NextResponse.json(
          { error: "url is required when mode='url'" },
          { status: 400 }
        );
      }

      const trimmedUrl = url.trim();
      if (trimmedUrl.length > MAX_URL_LENGTH || !isValidHttpUrl(trimmedUrl)) {
        return NextResponse.json(
          { error: "Please provide a valid menu or recipe URL." },
          { status: 400 }
        );
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      let sourceHtml = "";
      try {
        const sourceRes = await fetch(trimmedUrl, {
          signal: controller.signal,
          headers: {
            "User-Agent": "Plantmaxxing Menu Max",
          },
        });

        if (!sourceRes.ok) {
          return NextResponse.json(
            {
              error:
                "Could not read that link. Paste a screenshot/photo or use Find Recipe and I can analyze it.",
            },
            { status: 422 }
          );
        }

        sourceHtml = await sourceRes.text();
      } catch {
        return NextResponse.json(
          {
            error:
              "Could not read that link. Paste a screenshot/photo or use Find Recipe and I can analyze it.",
          },
          { status: 422 }
        );
      } finally {
        clearTimeout(timeout);
      }

      const visibleText = trimSourceText(extractVisibleTextFromHtml(sourceHtml));
      if (visibleText.length < 120) {
        sourceNotes.push("Source text was sparse; recommendations may be less precise.");
      }

      userMessageContent = JSON.stringify({
        mode,
        url: trimmedUrl,
        extractedSourceText: visibleText,
        context: context ?? null,
      });
    } else if (mode === "image") {
      if (typeof imageDataUrl !== "string" || imageDataUrl.trim().length === 0) {
        return NextResponse.json(
          { error: "imageDataUrl is required when mode='image'" },
          { status: 400 }
        );
      }

      if (
        imageDataUrl.length > MAX_IMAGE_DATA_URL_LENGTH ||
        !isValidMenuImageDataUrl(imageDataUrl)
      ) {
        return NextResponse.json(
          { error: "imageDataUrl must be a valid base64 data URL." },
          { status: 400 }
        );
      }

      userMessageContent = [
        {
          type: "text",
          text: JSON.stringify({
            mode,
            prompt:
              "Analyze this menu/recipe screenshot and suggest the top 3 plant-diversity picks.",
            context: context ?? null,
          }),
        },
        { type: "image_url", image_url: { url: imageDataUrl } },
      ];
    } else {
      if (typeof query !== "string" || query.trim().length === 0) {
        return NextResponse.json(
          { error: "query is required when mode='discover'" },
          { status: 400 }
        );
      }
      const trimmedQuery = query.trim();
      if (trimmedQuery.length > MAX_QUERY_LENGTH) {
        return NextResponse.json(
          { error: `query exceeds max length of ${MAX_QUERY_LENGTH} characters` },
          { status: 400 }
        );
      }

      const hits = await searchRecipeUrls(trimmedQuery);
      if (hits.length === 0) {
        return NextResponse.json(
          {
            error:
              "I couldn't find recipe pages for that query yet. Try a more specific search phrase.",
          },
          { status: 422 }
        );
      }

      const sourceCandidates = await Promise.allSettled(
        hits.slice(0, MAX_DISCOVER_SOURCES).map((hit) => fetchRecipeSource(hit))
      );
      const sources = sourceCandidates
        .map((result) => (result.status === "fulfilled" ? result.value : null))
        .filter((source): source is RecipeSource => Boolean(source));

      if (sources.length === 0) {
        return NextResponse.json(
          {
            error:
              "I found links but couldn't parse enough recipe detail. Try another query or paste a direct recipe link.",
          },
          { status: 422 }
        );
      }

      sourceNotes.push(`Analyzed ${sources.length} web recipe source${sources.length === 1 ? "" : "s"}.`);

      userMessageContent = JSON.stringify({
        mode,
        query: trimmedQuery,
        candidateSources: sources.map((source) => ({
          sourceTitle: source.title,
          sourceUrl: source.url,
          extractedText: source.text,
        })),
        context: context ?? null,
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let modelPayload: unknown;
    try {
      modelPayload = await openrouter.chat.completions.create(
        {
          model: MENU_MAX_MODEL,
          temperature: 0.2,
          max_tokens: 1200,
          messages: [
            { role: "system", content: MODEL_SYSTEM_PROMPT },
            { role: "user", content: userMessageContent },
          ],
          response_format: { type: "json_object" },
        },
        { signal: controller.signal }
      );
    } catch (error) {
      if (isOpenRouterAbortError(error)) {
        return NextResponse.json(
          { error: "Menu Max request timed out. Please try again." },
          { status: 504 }
        );
      }
      const status =
        typeof error === "object" && error !== null && "status" in error
          ? Number((error as { status?: unknown }).status)
          : null;
      console.error("Menu Max OpenRouter error:", status ?? "unknown", error);
      return NextResponse.json(
        { error: "Menu Max model request failed" },
        { status: 502 }
      );
    } finally {
      clearTimeout(timeout);
    }

    const modelContent = extractModelMessageContent(modelPayload);
    if (typeof modelContent !== "string") {
      return NextResponse.json(
        { error: "Menu Max returned an empty response" },
        { status: 502 }
      );
    }

    const parsed = parseModelMenuResponse(modelContent);
    if (!parsed) {
      return NextResponse.json(
        { error: "Menu Max could not parse recommendations from the model output" },
        { status: 502 }
      );
    }

    const { data: dbPlants } = await supabase.from("plant").select("name, category, points");
    const plantMap = new Map<string, PlantRow>(
      (dbPlants ?? []).map((plant: PlantRow) => [plant.name.toLowerCase(), plant as PlantRow])
    );

    const normalizedRecommendations = normalizeRecommendations(
      parsed.recommendations,
      plantMap,
      context
    );

    const response: MenuMaxResponse = {
      recommendations: normalizedRecommendations,
      logCandidates: mergeLogCandidates(normalizedRecommendations),
      sourceNotes: [...sourceNotes, ...parsed.sourceNotes],
      confidence: parsed.confidence,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Menu Max route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
