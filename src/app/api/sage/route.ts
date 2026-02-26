import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import {
  matchDeterministicSageRule,
  type SageContext,
  type SageResponse,
  type SageVerdict,
} from "../../../lib/ai/sageRules";
import {
  extractModelMessageContent,
  getSageRequestLimitError,
  parseSageTimeoutMs,
} from "./routeUtils";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const SAGE_OPENROUTER_MODEL =
  process.env.SAGE_OPENROUTER_MODEL ?? "x-ai/grok-4-fast";

const REQUEST_TIMEOUT_MS = parseSageTimeoutMs(
  process.env.SAGE_OPENROUTER_TIMEOUT_MS
);

const SAGE_SYSTEM_PROMPT = `You are Sage, an informational helper for Plantmaxxing.

Role:
- Give practical guidance for gray-area foods, especially processing distance from whole/minimally processed plants.
- Do not act like an enforcement bot.

Deterministic hard rules (must not be overridden):
1) Coffee counts as 0.25 points.
2) Tea counts as 0.25 points.
3) Bell pepper color variants (red/green/yellow) are the same species and treated as one unique weekly point total.
4) Duplicate species in the same week should not add a new unique point.

Return ONLY JSON object with this exact shape:
{
  "answer": "string",
  "verdict": "counts|partial|does_not_count|duplicate_week|uncertain",
  "points": number|null,
  "reason": "string",
  "confidence": number,
  "followUpQuestion": "string (optional)"
}

Guidelines:
- If uncertain, use verdict "uncertain" and points null.
- confidence must be 0..1.
- Keep answer concise and plain language.`;

const VALID_VERDICTS: SageVerdict[] = [
  "counts",
  "partial",
  "does_not_count",
  "duplicate_week",
  "uncertain",
];

function stripJsonFences(content: string): string {
  return content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
}

function makeFallbackResponse(): SageResponse {
  return {
    answer:
      "I'm not fully certain from the model response, but generally the closer to whole and minimally processed plants, the more likely it counts.",
    verdict: "uncertain",
    points: null,
    reason: "Model output was malformed or incomplete, so a safe fallback was used.",
    confidence: 0.35,
    followUpQuestion:
      "Can you share the exact food and how it was prepared so I can give a clearer call?",
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isValidContext(value: unknown): value is SageContext {
  if (value === undefined) return true;
  if (!isRecord(value)) return false;

  if (
    value.alreadyLoggedThisWeek !== undefined &&
    (!Array.isArray(value.alreadyLoggedThisWeek) ||
      !value.alreadyLoggedThisWeek.every((item) => typeof item === "string"))
  ) {
    return false;
  }

  if (value.recognizedPlants !== undefined) {
    if (!Array.isArray(value.recognizedPlants)) return false;
    const validPlants = value.recognizedPlants.every((item) => {
      if (!isRecord(item) || typeof item.name !== "string") return false;
      if (item.category !== undefined && typeof item.category !== "string") return false;
      if (item.points !== undefined && typeof item.points !== "number") return false;
      return true;
    });
    if (!validPlants) return false;
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


function clampConfidence(confidence: number): number {
  if (Number.isNaN(confidence)) return 0.35;
  if (confidence < 0) return 0;
  if (confidence > 1) return 1;
  return confidence;
}

function parseModelSageResponse(rawContent: string): SageResponse | null {
  const candidate = stripJsonFences(rawContent);
  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    return null;
  }

  if (!isRecord(parsed)) return null;
  if (typeof parsed.answer !== "string" || parsed.answer.trim().length === 0) return null;
  if (typeof parsed.reason !== "string" || parsed.reason.trim().length === 0) return null;
  if (!VALID_VERDICTS.includes(parsed.verdict as SageVerdict)) return null;
  if (typeof parsed.confidence !== "number") return null;
  if (parsed.points !== null && typeof parsed.points !== "number") return null;
  if (
    parsed.followUpQuestion !== undefined &&
    typeof parsed.followUpQuestion !== "string"
  ) {
    return null;
  }

  return {
    answer: parsed.answer.trim(),
    verdict: parsed.verdict as SageVerdict,
    points: parsed.points as number | null,
    reason: parsed.reason.trim(),
    confidence: clampConfidence(parsed.confidence),
    ...(parsed.followUpQuestion
      ? { followUpQuestion: parsed.followUpQuestion.trim() }
      : {}),
  };
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

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!isRecord(body)) {
      return NextResponse.json(
        { error: "Request body must be an object with question string" },
        { status: 400 }
      );
    }

    const question = body.question;
    const context = body.context;

    if (typeof question !== "string" || question.trim().length === 0) {
      return NextResponse.json(
        { error: "question must be a non-empty string" },
        { status: 400 }
      );
    }

    if (!isValidContext(context)) {
      return NextResponse.json({ error: "Invalid context shape" }, { status: 400 });
    }

    const limitError = getSageRequestLimitError(question, context);
    if (limitError) {
      return NextResponse.json({ error: limitError }, { status: 400 });
    }

    const deterministicMatch = matchDeterministicSageRule(question, context);
    if (deterministicMatch) {
      return NextResponse.json(deterministicMatch.response);
    }

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "Sage model is not configured" },
        { status: 500 }
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
          model: SAGE_OPENROUTER_MODEL,
          temperature: 0.2,
          max_tokens: 500,
          messages: [
            { role: "system", content: SAGE_SYSTEM_PROMPT },
            {
              role: "user",
              content: JSON.stringify({
                question: question.trim(),
                context: context ?? null,
              }),
            },
          ],
          response_format: {
            type: "json_object",
          },
        }),
        signal: controller.signal,
      });
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return NextResponse.json(
          { error: "Sage request timed out. Please try again." },
          { status: 504 }
        );
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }

    if (!orResponse.ok) {
      const errorText = await orResponse.text();
      console.error("Sage OpenRouter error:", orResponse.status, errorText);
      return NextResponse.json(
        { error: "Sage model request failed" },
        { status: 502 }
      );
    }

    let modelPayload: unknown;
    try {
      modelPayload = await orResponse.json();
    } catch {
      console.error("Sage OpenRouter success payload was not valid JSON");
      return NextResponse.json(makeFallbackResponse());
    }
    const modelContent = extractModelMessageContent(modelPayload);

    if (typeof modelContent !== "string") {
      console.error("Sage OpenRouter success payload missing message content");
      return NextResponse.json(makeFallbackResponse());
    }

    const parsed = parseModelSageResponse(modelContent);
    if (!parsed) {
      return NextResponse.json(makeFallbackResponse());
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Sage route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
