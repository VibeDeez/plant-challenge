import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const VISION_MODEL = "google/gemini-2.0-flash-lite-001";
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_REQUEST_BYTES = 5 * 1024 * 1024;
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

function isValidImageDataUrl(value: string): boolean {
  return /^data:image\/[a-zA-Z0-9.+-]+;base64,[a-zA-Z0-9+/=\s]+$/.test(value);
}

export async function POST(req: NextRequest) {
  if (!OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  try {
    const contentLength = Number(req.headers.get("content-length") ?? 0);
    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
      return NextResponse.json(
        { error: "Image payload is too large. Please use a smaller image." },
        { status: 413 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Request body must be an object with an image field" },
        { status: 400 }
      );
    }

    const { image } = body as { image?: unknown };

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "Missing image data" },
        { status: 400 }
      );
    }

    if (image.length > MAX_IMAGE_DATA_URL_LENGTH) {
      return NextResponse.json(
        { error: "Image payload is too large. Please use a smaller image." },
        { status: 413 }
      );
    }

    if (!isValidImageDataUrl(image)) {
      return NextResponse.json(
        { error: "Image must be a base64 data URL in data:image/... format" },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let orResponse: Response;

    try {
      orResponse = await fetch(OPENROUTER_URL, {
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
        signal: controller.signal,
      });
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return NextResponse.json(
          { error: "Recognition request timed out. Please try again." },
          { status: 504 }
        );
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }

    if (!orResponse.ok) {
      const errText = await orResponse.text();
      console.error("OpenRouter error:", orResponse.status, errText);
      return NextResponse.json(
        { error: "Vision model request failed" },
        { status: 502 }
      );
    }

    const orData = await orResponse.json();
    const content = orData.choices?.[0]?.message?.content ?? "[]";

    const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    let identified: { name: string; category: string }[];

    try {
      identified = JSON.parse(jsonStr);
      if (!Array.isArray(identified)) identified = [];
    } catch {
      console.error("Failed to parse vision response:", content);
      identified = [];
    }

    const validCategories = new Set([
      "Fruits", "Vegetables", "Whole Grains", "Legumes",
      "Nuts", "Seeds", "Herbs", "Spices",
    ]);

    identified = identified.filter(
      (item) =>
        item.name &&
        typeof item.name === "string" &&
        item.category &&
        validCategories.has(item.category)
    );

    if (identified.length === 0) {
      return NextResponse.json({ plants: [] });
    }

    const { data: dbPlants } = await supabase.from("plant").select("name, category, points");

    const plantMap = new Map(
      (dbPlants ?? []).map((p) => [p.name.toLowerCase(), p])
    );

    const results = identified.map((item) => {
      const match = plantMap.get(item.name.toLowerCase());
      const isHerbOrSpice =
        item.category === "Herbs" || item.category === "Spices";
      return {
        name: match ? match.name : item.name,
        category: match ? match.category : item.category,
        points: match ? match.points : isHerbOrSpice ? 0.25 : 1,
        matched: !!match,
      };
    });

    return NextResponse.json({ plants: results });
  } catch (err) {
    console.error("Recognize error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
