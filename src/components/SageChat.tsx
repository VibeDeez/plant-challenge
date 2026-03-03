"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { SageResponse, SageVerdict } from "@/lib/ai/sageRules";
import { AlertTriangle, MessageCircle } from "lucide-react";
import { DUPLICATE_SPECIES_GUARD_COPY } from "@/lib/copy";

type SageChatProps = {
  alreadyLoggedThisWeek?: string[];
};

type SageApiError = {
  error?: string;
};

const VERDICT_LABELS: Record<SageVerdict, string> = {
  counts: "Counts",
  partial: "Partial",
  does_not_count: "Does not count",
  duplicate_week: "Duplicate this week",
  uncertain: "Uncertain",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isSageResponse(value: unknown): value is SageResponse {
  if (!isRecord(value)) return false;
  return (
    typeof value.answer === "string" &&
    typeof value.reason === "string" &&
    typeof value.verdict === "string" &&
    typeof value.confidence === "number" &&
    (typeof value.points === "number" || value.points === null) &&
    (value.followUpQuestion === undefined ||
      typeof value.followUpQuestion === "string")
  );
}

export default function SageChat({ alreadyLoggedThisWeek = [] }: SageChatProps) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<SageResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<string | null>(null);

  const normalizedContext = useMemo(
    () => Array.from(new Set(alreadyLoggedThisWeek.map((item) => item.trim()).filter(Boolean))),
    [alreadyLoggedThisWeek]
  );

  async function submitQuestion(rawQuestion: string) {
    const trimmed = rawQuestion.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/sage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: trimmed,
          context:
            normalizedContext.length > 0
              ? { alreadyLoggedThisWeek: normalizedContext }
              : undefined,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as SageApiError | null;
        setError(body?.error ?? "Sage is unavailable right now. Please try again.");
        setResponse(null);
        setMode(null);
        return;
      }

      const body = (await res.json()) as unknown;
      if (!isSageResponse(body)) {
        setError("Sage returned an unexpected response. Please try again.");
        setResponse(null);
        setMode(null);
        return;
      }

      setMode(res.headers.get("x-sage-mode"));
      setResponse(body);
    } catch {
      setError("Could not reach Sage. Check your connection and try again.");
      setResponse(null);
      setMode(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitQuestion(question);
  }

  return (
    <section className="bg-brand-cream px-page py-section grain-light" data-testid="sage-chat-section">
      <div className="max-w-lg mx-auto">
        <div className="rounded-2xl border border-brand-dark/10 bg-white/70 p-4">
          <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-muted">
            <MessageCircle size={14} />
            Ask Sage
          </p>
          <h2 className="text-lg font-display text-brand-dark">Rule Q&A</h2>
          <p className="mt-1 text-sm text-brand-muted">
            Quick help for count rules and point questions.
          </p>

          <form onSubmit={handleSubmit} className="mt-3 space-y-2">
            <label htmlFor="sage-question" className="text-xs font-medium text-brand-muted">
              Your question
            </label>
            <textarea
              id="sage-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="e.g. Does almond milk count?"
              className="w-full rounded-xl border border-brand-dark/10 bg-white px-3 py-2.5 text-sm text-brand-dark placeholder:text-brand-muted/70 focus:border-brand-green focus:outline-none"
              rows={3}
              maxLength={500}
            />
            <button
              type="submit"
              disabled={loading || question.trim().length === 0}
              className="w-full min-h-11 rounded-xl bg-brand-green px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-green-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Asking Sage..." : "Ask Sage"}
            </button>
          </form>

          {error && (
            <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          {response && (
            <div className="mt-3 space-y-2 rounded-xl border border-brand-dark/10 bg-brand-cream/60 p-3 text-sm text-brand-dark">
              {mode === "deterministic-only-fallback" && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800">
                  Sage is in deterministic-only fallback mode. Answers are limited to hard rules.
                </p>
              )}
              <p>
                <span className="font-semibold">Answer:</span> {response.answer}
              </p>
              <p>
                <span className="font-semibold">Verdict:</span> {VERDICT_LABELS[response.verdict]}
              </p>
              {response.verdict === "duplicate_week" && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-amber-800 flex items-center gap-1.5">
                  <AlertTriangle size={14} />
                  {DUPLICATE_SPECIES_GUARD_COPY}
                </p>
              )}
              {response.points !== null && (
                <p>
                  <span className="font-semibold">Points:</span> {response.points}
                </p>
              )}
              <p>
                <span className="font-semibold">Reason:</span> {response.reason}
              </p>
              {response.followUpQuestion && (
                <p>
                  <span className="font-semibold">Follow-up:</span> {response.followUpQuestion}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
