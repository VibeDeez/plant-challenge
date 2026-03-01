import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api/errors";
import { createApiTelemetry } from "@/lib/api/telemetry";
import {
  fetchWithPolicy,
  VOICE_OPENROUTER_POLICY,
} from "@/lib/ai/openRouterPolicy";
import {
  buildAnalyticsEvent,
  trackAnalyticsEvent,
} from "@/lib/analytics/events";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const VOICE_OPENROUTER_MODEL =
  process.env.VOICE_OPENROUTER_MODEL ?? "openai/gpt-audio-mini";

const VOICE_POLICY = {
  ...VOICE_OPENROUTER_POLICY,
  timeoutMs: parseVoiceTimeoutMs(process.env.VOICE_OPENROUTER_TIMEOUT_MS),
};

const ALLOWED_AUDIO_FORMATS = new Set([
  "wav",
  "mp3",
  "m4a",
  "ogg",
  "webm",
  "flac",
]);

const SYSTEM_PROMPT = `You are a transcription and extraction assistant for a plant diversity tracking app.

Given the input audio, return ONLY valid JSON with this exact shape:
{
  "transcript": "string",
  "candidates": [{ "name": "string", "confidence": number }]
}

Rules:
- Transcript should be natural language transcription of what the user said.
- candidates should contain unique plant names only.
- confidence must be a number between 0 and 1.
- If no plants are found, return an empty candidates array.
- Do not include markdown fences or extra commentary.`;

type VoiceLogErrorCode =
  | "VOICE_LOG_API_KEY_MISSING"
  | "VOICE_LOG_PAYLOAD_TOO_LARGE"
  | "VOICE_LOG_INVALID_JSON"
  | "VOICE_LOG_INVALID_BODY"
  | "VOICE_LOG_AUDIO_MISSING"
  | "VOICE_LOG_AUDIO_INVALID"
  | "VOICE_LOG_FORMAT_INVALID"
  | "VOICE_LOG_TIMEOUT"
  | "VOICE_LOG_PROVIDER_FAILURE"
  | "VOICE_LOG_INTERNAL_ERROR"
  | "AUTH_UNAUTHORIZED";

type VoiceLogCandidate = {
  name: string;
  confidence: number;
};

function parseVoiceTimeoutMs(rawValue: string | undefined): number {
  const defaultTimeout = VOICE_OPENROUTER_POLICY.timeoutMs;
  if (!rawValue) return defaultTimeout;
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) return defaultTimeout;
  return Math.min(60_000, Math.max(1_000, Math.floor(parsed)));
}

function stripJsonFences(content: string): string {
  return content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
}

function isBase64(value: string): boolean {
  const normalized = value.replace(/\s/g, "");
  if (normalized.length === 0 || normalized.length % 4 !== 0) return false;
  return /^[A-Za-z0-9+/]+={0,2}$/.test(normalized);
}

function getBase64DecodedBytes(value: string): number {
  const normalized = value.replace(/\s/g, "");

  let padding = 0;
  if (normalized.endsWith("==")) {
    padding = 2;
  } else if (normalized.endsWith("=")) {
    padding = 1;
  }

  return Math.floor((normalized.length * 3) / 4) - padding;
}

function normalizeCandidateName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

function getLocaleLabel(locale: unknown): string {
  if (typeof locale === "string") {
    return locale;
  }
  return "unknown locale";
}

function parseModelPayload(content: string): {
  transcript: string;
  candidates: VoiceLogCandidate[];
  parseFailed: boolean;
} {
  const cleaned = stripJsonFences(content);

  const tryParse = (raw: string) => {
    const parsed = JSON.parse(raw) as {
      transcript?: unknown;
      candidates?: unknown;
    };

    const transcript =
      typeof parsed?.transcript === "string" ? parsed.transcript.trim() : "";

    const seen = new Set<string>();
    const candidates = Array.isArray(parsed?.candidates)
      ? parsed.candidates
          .filter(
            (item): item is { name?: unknown; confidence?: unknown } =>
              !!item && typeof item === "object" && !Array.isArray(item)
          )
          .map((item) => {
            const name =
              typeof item.name === "string" ? normalizeCandidateName(item.name) : "";
            const confidence =
              typeof item.confidence === "number" && Number.isFinite(item.confidence)
                ? Math.max(0, Math.min(1, item.confidence))
                : NaN;
            return { name, confidence };
          })
          .filter((item) => item.name.length > 0 && Number.isFinite(item.confidence))
          .filter((item) => {
            const key = item.name.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          })
      : [];

    return { transcript, candidates, parseFailed: false as const };
  };

  try {
    return tryParse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      try {
        return tryParse(cleaned.slice(firstBrace, lastBrace + 1));
      } catch {
        // fall through to parse_failed
      }
    }
    return { transcript: "", candidates: [], parseFailed: true };
  }
}

function extractModelContent(payload: unknown): string {
  const raw = (payload as { choices?: Array<{ message?: { content?: unknown } }> })
    ?.choices?.[0]?.message?.content;

  if (typeof raw === "string") return raw;

  if (Array.isArray(raw)) {
    return raw
      .map((part) => {
        if (!part || typeof part !== "object") return "";
        const text = (part as { text?: unknown }).text;
        return typeof text === "string" ? text : "";
      })
      .join("")
      .trim();
  }

  return "";
}

export async function POST(req: NextRequest) {
  const contentLength = Number(req.headers.get("content-length") ?? 0);
  const requestSizeBytes = Number.isFinite(contentLength) ? contentLength : null;
  const telemetry = createApiTelemetry("/api/voice-log", requestSizeBytes);
  let parseFailed = false;
  let fallbackUsed = false;
  let actorId: string | undefined;

  const respondError = (
    status: number,
    code: VoiceLogErrorCode,
    message: string,
    extras?: { timeout?: boolean }
  ) => {
    telemetry({
      statusCode: status,
      parseFailed,
      fallbackUsed,
      timeout: extras?.timeout,
    });
    trackAnalyticsEvent(
      buildAnalyticsEvent(
        "voice_log_transcription_failed",
        "server",
        {
          endpoint: "/api/voice-log",
          status_code: status,
          error_code: code,
          timeout: !!extras?.timeout,
          parse_failed: parseFailed,
          fallback_used: fallbackUsed,
        },
        actorId
      )
    );
    return apiError(status, code, message);
  };

  const respondOk = (payload: unknown) => {
    telemetry({ statusCode: 200, parseFailed, fallbackUsed });
    trackAnalyticsEvent(
      buildAnalyticsEvent(
        "voice_log_transcription_succeeded",
        "server",
        {
          endpoint: "/api/voice-log",
          parse_failed: parseFailed,
          fallback_used: fallbackUsed,
        },
        actorId
      )
    );
    trackAnalyticsEvent(
      buildAnalyticsEvent(
        parseFailed ? "voice_log_parse_failed" : "voice_log_parse_succeeded",
        "server",
        {
          endpoint: "/api/voice-log",
          fallback_used: fallbackUsed,
        },
        actorId
      )
    );
    return NextResponse.json(payload);
  };

  if (!OPENROUTER_API_KEY) {
    return respondError(500, "VOICE_LOG_API_KEY_MISSING", "API key not configured");
  }

  try {
    if (requestSizeBytes !== null && requestSizeBytes > VOICE_POLICY.maxRequestBytes) {
      return respondError(
        413,
        "VOICE_LOG_PAYLOAD_TOO_LARGE",
        "Audio payload is too large. Please use a shorter clip."
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
      return respondError(400, "VOICE_LOG_INVALID_JSON", "Invalid JSON body");
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return respondError(
        400,
        "VOICE_LOG_INVALID_BODY",
        "Request body must be an object with audioBase64 and format"
      );
    }

    const { audioBase64, format, locale } = body as {
      audioBase64?: unknown;
      format?: unknown;
      locale?: unknown;
    };

    if (typeof audioBase64 !== "string" || audioBase64.trim().length === 0) {
      return respondError(400, "VOICE_LOG_AUDIO_MISSING", "Missing audioBase64");
    }

    if (!isBase64(audioBase64)) {
      return respondError(400, "VOICE_LOG_AUDIO_INVALID", "audioBase64 must be valid base64");
    }

    const audioBytes = getBase64DecodedBytes(audioBase64);
    if (audioBytes > VOICE_POLICY.maxRequestBytes) {
      return respondError(
        413,
        "VOICE_LOG_PAYLOAD_TOO_LARGE",
        "Audio payload is too large. Please use a shorter clip."
      );
    }

    if (typeof format !== "string" || !ALLOWED_AUDIO_FORMATS.has(format.toLowerCase())) {
      return respondError(
        400,
        "VOICE_LOG_FORMAT_INVALID",
        "format must be one of: wav, mp3, m4a, ogg, webm, flac"
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
            model: VOICE_OPENROUTER_MODEL,
            temperature: 0,
            max_tokens: 700,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `Transcribe this audio (${getLocaleLabel(locale)}) and extract unique plants.`,
                  },
                  {
                    type: "input_audio",
                    input_audio: {
                      data: audioBase64,
                      format: format.toLowerCase(),
                    },
                  },
                ],
              },
            ],
          }),
        },
        VOICE_POLICY
      );
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return respondError(
          504,
          "VOICE_LOG_TIMEOUT",
          "Voice log request timed out. Please try again.",
          { timeout: true }
        );
      }
      throw error;
    }

    if (!orResponse.ok) {
      const errorText = await orResponse.text();
      console.error("Voice log OpenRouter error:", orResponse.status, errorText);
      return respondError(502, "VOICE_LOG_PROVIDER_FAILURE", "Voice model request failed");
    }

    let modelPayload: unknown;
    try {
      modelPayload = await orResponse.json();
    } catch {
      parseFailed = true;
      fallbackUsed = true;
      return respondOk({
        transcript: "",
        candidates: [],
        warnings: [{ reason: "parse_failed" }],
      });
    }

    const content = extractModelContent(modelPayload);

    if (!content) {
      parseFailed = true;
      fallbackUsed = true;
      return respondOk({
        transcript: "",
        candidates: [],
        warnings: [{ reason: "parse_failed" }],
      });
    }

    const parsed = parseModelPayload(content);
    parseFailed = parsed.parseFailed;
    fallbackUsed = parsed.parseFailed;

    if (parsed.parseFailed) {
      return respondOk({
        transcript: content.trim(),
        candidates: [],
        warnings: [{ reason: "parse_failed" }],
      });
    }

    const warnings = parsed.candidates
      .filter((candidate) => candidate.confidence < 0.9)
      .map((candidate) => ({ name: candidate.name, reason: "low_confidence" }));

    return respondOk({
      transcript: parsed.transcript,
      candidates: parsed.candidates,
      warnings,
    });
  } catch (error) {
    console.error("Voice log route error:", error);
    return respondError(500, "VOICE_LOG_INTERNAL_ERROR", "Internal server error");
  }
}
