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
  makeDeterministicOnlySageFallbackResponse,
  parseSageTimeoutMs,
} from "./routeUtils";
import { apiError } from "@/lib/api/errors";
import { createApiTelemetry } from "@/lib/api/telemetry";
import {
  fetchWithPolicy,
  parseBooleanFlag,
  SAGE_OPENROUTER_POLICY,
} from "@/lib/ai/openRouterPolicy";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const SAGE_OPENROUTER_MODEL =
  process.env.SAGE_OPENROUTER_MODEL ?? "x-ai/grok-4-fast";

const SAGE_POLICY = {
  ...SAGE_OPENROUTER_POLICY,
  timeoutMs: parseSageTimeoutMs(process.env.SAGE_OPENROUTER_TIMEOUT_MS),
};

const SAGE_DETERMINISTIC_ONLY = parseBooleanFlag(
  process.env.SAGE_DETERMINISTIC_ONLY
);

const SAGE_MODE_HEADER = "x-sage-mode";
type SageMode =
  | "deterministic-rule"
  | "deterministic-only-fallback"
  | "model"
  | "model-fallback";

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
      if (item.category !== undefined && typeof item.category !== "string")
        return false;
      if (item.points !== undefined && typeof item.points !== "number")
        return false;
      return true;
    });
    if (!validPlants) return false;
  }

  if (value.weekProgress !== undefined) {
    if (!isRecord(value.weekProgress)) return false;
    const { points, uniquePlants, target } = value.weekProgress;
    if (points !== undefined && typeof points !== "number") return false;
    if (uniquePlants !== undefined && typeof uniquePlants !== "number")
      return false;
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
  if (typeof parsed.answer !== "string" || parsed.answer.trim().length === 0)
    return null;
  if (typeof parsed.reason !== "string" || parsed.reason.trim().length === 0)
    return null;
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
  const contentLength = Number(req.headers.get("content-length") ?? 0);
  const requestSizeBytes = Number.isFinite(contentLength) ? contentLength : null;
  const telemetry = createApiTelemetry("/api/sage", requestSizeBytes);
  let parseFailed = false;
  let fallbackUsed = false;

  const respondError = (
    status: number,
    code:
      | "SAGE_INVALID_JSON"
      | "SAGE_INVALID_BODY"
      | "SAGE_QUESTION_INVALID"
      | "SAGE_CONTEXT_INVALID"
      | "SAGE_REQUEST_LIMIT"
      | "SAGE_MODEL_NOT_CONFIGURED"
      | "SAGE_TIMEOUT"
      | "SAGE_PROVIDER_FAILURE"
      | "SAGE_INTERNAL_ERROR"
      | "AUTH_UNAUTHORIZED",
    message: string,
    extras?: { timeout?: boolean }
  ) => {
    telemetry({
      statusCode: status,
      parseFailed,
      fallbackUsed,
      timeout: extras?.timeout,
    });
    return apiError(status, code, message);
  };

  const respondOk = (payload: unknown, mode: SageMode) => {
    telemetry({ statusCode: 200, parseFailed, fallbackUsed });
    const response = NextResponse.json(payload);
    response.headers.set(SAGE_MODE_HEADER, mode);
    return response;
  };

  try {
    if (
      requestSizeBytes !== null &&
      requestSizeBytes > SAGE_POLICY.maxRequestBytes
    ) {
      return respondError(
        413,
        "SAGE_REQUEST_LIMIT",
        `Request exceeds max payload of ${SAGE_POLICY.maxRequestBytes} bytes`
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return respondError(401, "AUTH_UNAUTHORIZED", "Unauthorized");
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return respondError(400, "SAGE_INVALID_JSON", "Invalid JSON body");
    }

    if (!isRecord(body)) {
      return respondError(
        400,
        "SAGE_INVALID_BODY",
        "Request body must be an object with question string"
      );
    }

    const question = body.question;
    const context = body.context;

    if (typeof question !== "string" || question.trim().length === 0) {
      return respondError(
        400,
        "SAGE_QUESTION_INVALID",
        "question must be a non-empty string"
      );
    }

    if (!isValidContext(context)) {
      return respondError(400, "SAGE_CONTEXT_INVALID", "Invalid context shape");
    }

    const limitError = getSageRequestLimitError(question, context);
    if (limitError) {
      return respondError(400, "SAGE_REQUEST_LIMIT", limitError);
    }

    const deterministicMatch = matchDeterministicSageRule(question, context);
    if (deterministicMatch) {
      return respondOk(deterministicMatch.response, "deterministic-rule");
    }

    if (SAGE_DETERMINISTIC_ONLY) {
      fallbackUsed = true;
      return respondOk(
        makeDeterministicOnlySageFallbackResponse(),
        "deterministic-only-fallback"
      );
    }

    if (!OPENROUTER_API_KEY) {
      return respondError(500, "SAGE_MODEL_NOT_CONFIGURED", "Sage model is not configured");
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
        },
        SAGE_POLICY
      );
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return respondError(504, "SAGE_TIMEOUT", "Sage request timed out. Please try again.", {
          timeout: true,
        });
      }
      throw error;
    }

    if (!orResponse.ok) {
      const errorText = await orResponse.text();
      console.error("Sage OpenRouter error:", orResponse.status, errorText);
      return respondError(502, "SAGE_PROVIDER_FAILURE", "Sage model request failed");
    }

    let modelPayload: unknown;
    try {
      modelPayload = await orResponse.json();
    } catch {
      console.error("Sage OpenRouter success payload was not valid JSON");
      fallbackUsed = true;
      parseFailed = true;
      return respondOk(makeFallbackResponse(), "model-fallback");
    }
    const modelContent = extractModelMessageContent(modelPayload);

    if (typeof modelContent !== "string") {
      console.error("Sage OpenRouter success payload missing message content");
      fallbackUsed = true;
      parseFailed = true;
      return respondOk(makeFallbackResponse(), "model-fallback");
    }

    const parsed = parseModelSageResponse(modelContent);
    if (!parsed) {
      parseFailed = true;
      fallbackUsed = true;
      return respondOk(makeFallbackResponse(), "model-fallback");
    }

    return respondOk(parsed, "model");
  } catch (error) {
    console.error("Sage route error:", error);
    return respondError(500, "SAGE_INTERNAL_ERROR", "Internal server error");
  }
}
