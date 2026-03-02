const limiterStore = new Map<string, number[]>();

type RateLimitResult =
  | {
      ok: true;
      retryAfterSeconds: 0;
      remaining: number;
    }
  | {
      ok: false;
      retryAfterSeconds: number;
      remaining: 0;
    };

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  const existing = limiterStore.get(key) ?? [];
  const inWindow = existing.filter((ts) => ts > windowStart);

  if (inWindow.length >= limit) {
    const oldest = inWindow[0] ?? now;
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldest + windowMs - now) / 1000)
    );

    limiterStore.set(key, inWindow);
    return { ok: false, retryAfterSeconds, remaining: 0 };
  }

  const updated = [...inWindow, now];
  limiterStore.set(key, updated);

  return {
    ok: true,
    retryAfterSeconds: 0,
    remaining: Math.max(0, limit - updated.length),
  };
}
