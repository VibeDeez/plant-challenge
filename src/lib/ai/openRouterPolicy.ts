export type OpenRouterPolicy = {
  timeoutMs: number;
  maxRequestBytes: number;
  retryCount: number;
  retryDelayMs: number;
};

export const RECOGNIZE_OPENROUTER_POLICY: OpenRouterPolicy = {
  timeoutMs: 15_000,
  maxRequestBytes: 5 * 1024 * 1024,
  retryCount: 1,
  retryDelayMs: 250,
};

export const SAGE_OPENROUTER_POLICY: OpenRouterPolicy = {
  timeoutMs: 12_000,
  maxRequestBytes: 200 * 1024,
  retryCount: 1,
  retryDelayMs: 250,
};

export function parseBooleanFlag(rawValue: string | undefined): boolean {
  if (!rawValue) return false;
  const normalized = rawValue.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

export async function fetchWithPolicy(
  url: string,
  init: RequestInit,
  policy: OpenRouterPolicy
): Promise<Response> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= policy.retryCount) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), policy.timeoutMs);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });

      if (response.ok || response.status < 500 || attempt >= policy.retryCount) {
        clearTimeout(timeout);
        return response;
      }
    } catch (error) {
      lastError = error;
      if ((error as Error).name !== "AbortError" && attempt >= policy.retryCount) {
        clearTimeout(timeout);
        throw error;
      }
      if ((error as Error).name === "AbortError") {
        clearTimeout(timeout);
        throw error;
      }
    } finally {
      clearTimeout(timeout);
    }

    attempt += 1;
    await new Promise((resolve) => setTimeout(resolve, policy.retryDelayMs));
  }

  if (lastError) throw lastError;
  throw new Error("OpenRouter request failed with retry policy");
}
