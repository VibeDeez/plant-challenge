"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { SageResponse, SageVerdict } from "@/lib/ai/sageRules";
import { Sparkles } from "lucide-react";

type SageChatProps = {
  alreadyLoggedThisWeek?: string[];
};

type SageApiError = {
  error?: string;
};

const STARTER_PROMPTS = [
  "I drank black coffee this morning. How many points is that?",
  "I had red and green bell pepper this week. Is that one species?",
  "I ate plain oatmeal with walnuts. Does that count?",
] as const;

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
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<SageResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        return;
      }

      const body = (await res.json()) as unknown;
      if (!isSageResponse(body)) {
        setError("Sage returned an unexpected response. Please try again.");
        setResponse(null);
        return;
      }

      setResponse(body);
    } catch {
      setError("Could not reach Sage. Check your connection and try again.");
      setResponse(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitQuestion(question);
  }

  function handleStarterPrompt(prompt: string) {
    setQuestion(prompt);
  }

  return (
    <section className="bg-brand-cream px-5 py-5 grain-light" data-testid="sage-chat-section">
      <div className="max-w-lg mx-auto">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-full min-h-11 rounded-2xl border border-brand-dark/10 bg-white/70 px-4 py-3 text-left transition-colors hover:bg-white"
          aria-expanded={isOpen}
          aria-controls="sage-chat-panel"
        >
          <span className="flex items-start gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-green/15 text-brand-dark">
              <Sparkles size={16} strokeWidth={2} />
            </span>
            <span>
              <span className="block text-sm font-semibold text-brand-dark">Ask Sage</span>
              <span className="block text-xs text-brand-muted">
                Quick help for count rules and point questions.
              </span>
            </span>
          </span>
        </button>

        {isOpen && (
          <div
            id="sage-chat-panel"
            className="mt-3 rounded-2xl border border-brand-dark/10 bg-white/70 p-3"
          >
            <div className="mb-3 flex flex-wrap gap-2">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleStarterPrompt(prompt)}
                  disabled={loading}
                  className="min-h-11 rounded-full border border-brand-dark/15 bg-white px-3 py-2 text-xs font-semibold text-brand-dark transition-colors hover:bg-brand-dark/5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-2">
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
                <p>
                  <span className="font-semibold">Answer:</span> {response.answer}
                </p>
                <p>
                  <span className="font-semibold">Verdict:</span> {VERDICT_LABELS[response.verdict]}
                </p>
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
        )}
      </div>
    </section>
  );
}
