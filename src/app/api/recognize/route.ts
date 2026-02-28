import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api/errors";
import { createApiTelemetry } from "@/lib/api/telemetry";
import {
  fetchWithPolicy,
  RECOGNIZE_OPENROUTER_POLICY,
} from "@/lib/ai/openRouterPolicy";
import {
  buildAnalyticsEvent,
  trackAnalyticsEvent,
} from "@/lib/analytics/events";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const VISION_MODEL = "google/gemini-2.0-flash-lite-001";
const MAX_IMAGE_DATA_URL_LENGTH = 4 * 1024 * 1024;

const SYSTEM_PROMPT = `You are a food recognition assistant for a plant diversity tracking app. Analyze the photo and identify all visible plant-based whole foods.

Rules:
- Only identify plant-based foods (no meat, dairy, eggs, oils, or heavily processed items)
- Each plant species should be listed once
- Categorize each into exactly one of: Fruits, Vegetables, Whole Grains, Legumes, Nuts, Seeds, Herbs, Spices
- For mixed dishes, list the individual plant components you can identify
- Use common English names (e.g. "Tomato" not "Solanum lycopersicum")
- Be specific: "Red Lentils" not just "Lentils", "Brown Rice" not just "Rice"
- If you can see garnishes or herbs, include them

Respond with ONLY a JSON array, no other text:
[{"name": "Plant Name", "category": "Category"}]

If no plant foods are visible, respond with: []`;

type RecognizeErrorCode =
  | "RECOGNIZE_API_KEY_MISSING"
  | "RECOGNIZE_PAYLOAD_TOO_LARGE"
  | "RECOGNIZE_INVALID_JSON"
  | "RECOGNIZE_INVALID_BODY"
  | "RECOGNIZE_IMAGE_MISSING"
  | "RECOGNIZE_IMAGE_INVALID"
  | "RECOGNIZE_TIMEOUT"
  | "RECOGNIZE_PROVIDER_FAILURE"
  | "RECOGNIZE_INTERNAL_ERROR"
  | "AUTH_UNAUTHORIZED";

function isValidImageDataUrl(value: string): boolean {
  return /^data:image\/[a-zA-Z0-9.+-]+;base64,[a-zA-Z0-9+/=\s]+$/.test(value);
}

export async function POST(req: NextRequest) {
  const contentLength = Number(req.headers.get("content-length") ?? 0);
  const requestSizeBytes = Number.isFinite(contentLength) ? contentLength : null;
  const telemetry = createApiTelemetry("/api/recognize", requestSizeBytes);
  let parseFailed = false;
  let actorId: string | undefined;

  const respondError = (
    status: number,
    code: RecognizeErrorCode,
    message: string,
    extras?: { timeout?: boolean }
  ) => {
    telemetry({ statusCode: status, parseFailed, timeout: extras?.timeout });
    trackAnalyticsEvent(
      buildAnalyticsEvent(
        "recognize_failure",
        "server",
        {
          endpoint: "/api/recognize",
          status_code: status,
          error_code: code,
          timeout: !!extras?.timeout,
          parse_failed: parseFailed,
        },
        actorId
      )
    );
    return apiError(status, code, message);
  };

  const respondOk = (payload: unknown, extras?: { plantCount?: number }) => {
    telemetry({ statusCode: 200, parseFailed });
    trackAnalyticsEvent(
      buildAnalyticsEvent(
        "recognize_success",
        "server",
        {
          endpoint: "/api/recognize",
          plant_count: extras?.plantCount ?? null,
          parse_failed: parseFailed,
        },
        actorId
      )
    );
    return NextResponse.json(payload);
  };

  if (!OPENROUTER_API_KEY) {
    return respondError(500, "RECOGNIZE_API_KEY_MISSING", "API key not configured");
  }

  try {
    if (
      requestSizeBytes !== null &&
      requestSizeBytes > RECOGNIZE_OPENROUTER_POLICY.maxRequestBytes
    ) {
      return respondError(
        413,
        "RECOGNIZE_PAYLOAD_TOO_LARGE",
        "Image payload is too large. Please use a smaller image."
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return respondError(401, "AUTH_UNAUTHORIZED", "Unauthorized");
    }
    actorId = user.id;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return respondError(400, "RECOGNIZE_INVALID_JSON", "Invalid JSON body");
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return respondError(
        400,
        "RECOGNIZE_INVALID_BODY",
        "Request body must be an object with an image field"
      );
    }

    const { image } = body as { image?: unknown };

    if (!image || typeof image !== "string") {
      return respondError(400, "RECOGNIZE_IMAGE_MISSING", "Missing image data");
    }

    if (image.length > MAX_IMAGE_DATA_URL_LENGTH) {
      return respondError(
        413,
        "RECOGNIZE_PAYLOAD_TOO_LARGE",
        "Image payload is too large. Please use a smaller image."
      );
    }

    if (!isValidImageDataUrl(image)) {
      return respondError(
        400,
        "RECOGNIZE_IMAGE_INVALID",
        "Image must be a base64 data URL in data:image/... format"
      );
    }

    let orResponse: Response;

    try {
      orResponse = await fetchWithPolicy(
        OPENROUTER_URL,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: VISION_MODEL,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Identify the plant-based foods in this photo.",
                  },
                  { type: "image_url", image_url: { url: image } },
                ],
              },
            ],
            temperature: 0.1,
            max_tokens: 1024,
          }),
        },
        RECOGNIZE_OPENROUTER_POLICY
      );
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return respondError(
          504,
          "RECOGNIZE_TIMEOUT",
          "Recognition request timed out. Please try again.",
          { timeout: true }
        );
      }
      throw error;
    }

    if (!orResponse.ok) {
      const errText = await orResponse.text();
      console.error("OpenRouter error:", orResponse.status, errText);
      return respondError(502, "RECOGNIZE_PROVIDER_FAILURE", "Vision model request failed");
    }

    const orData = await orResponse.json();
    const content = orData.choices?.[0]?.message?.content ?? "[]";

    const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    let identified: { name: string; category: string }[];

    try {
      identified = JSON.parse(jsonStr);
      if (!Array.isArray(identified)) identified = [];
    } catch {
      console.error("Failed to parse vision response");
      parseFailed = true;
      identified = [];
    }

    const validCategories = new Set([
      "Fruits",
      "Vegetables",
      "Whole Grains",
      "Legumes",
      "Nuts",
      "Seeds",
      "Herbs",
      "Spices",
    ]);

    identified = identified.filter(
      (item) =>
        item.name &&
        typeof item.name === "string" &&
        item.category &&
        validCategories.has(item.category)
    );

    if (identified.length === 0) {
      return respondOk({ plants: [] }, { plantCount: 0 });
    }

    const { data: dbPlants } = await supabase.from("plant").select("name, category, points");

    const plantMap = new Map((dbPlants ?? []).map((p) => [p.name.toLowerCase(), p]));

    const results = identified.map((item) => {
      const match = plantMap.get(item.name.toLowerCase());
      const isHerbOrSpice = item.category === "Herbs" || item.category === "Spices";
      return {
        name: match ? match.name : item.name,
        category: match ? match.category : item.category,
        points: match ? match.points : isHerbOrSpice ? 0.25 : 1,
        matched: !!match,
      };
    });

    return respondOk({ plants: results }, { plantCount: results.length });
  } catch (err) {
    console.error("Recognize error:", err);
    return respondError(500, "RECOGNIZE_INTERNAL_ERROR", "Internal server error");
  }
}
