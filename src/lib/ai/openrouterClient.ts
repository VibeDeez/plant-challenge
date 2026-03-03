import OpenAI from "openai";

let cachedClient: OpenAI | null | undefined;

export function getOpenRouterClient(): OpenAI | null {
  if (cachedClient !== undefined) return cachedClient;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    cachedClient = null;
    return null;
  }

  cachedClient = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });
  return cachedClient;
}

export function isOpenRouterAbortError(error: unknown): boolean {
  return (
    (error instanceof Error && error.name === "AbortError") ||
    (typeof error === "object" &&
      error !== null &&
      "name" in error &&
      (error as { name?: string }).name === "AbortError")
  );
}
