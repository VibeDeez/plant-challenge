const fallbackLimiterStore = new Map<string, number[]>();

export type RateLimitResult =
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

type RateLimitRpcRow = {
  allowed?: boolean;
  retry_after_seconds?: number;
  remaining?: number;
};

type RateLimitClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>
  ) => PromiseLike<{
    data: RateLimitRpcRow[] | RateLimitRpcRow | null;
    error: { code?: string | null; message?: string | null } | null;
  }>;
};

function fallbackRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;
  const existing = fallbackLimiterStore.get(key) ?? [];
  const inWindow = existing.filter((timestamp) => timestamp > windowStart);

  if (inWindow.length >= limit) {
    const oldest = inWindow[0] ?? now;
    fallbackLimiterStore.set(key, inWindow);
    return {
      ok: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((oldest + windowMs - now) / 1000)
      ),
      remaining: 0,
    };
  }

  const updated = [...inWindow, now];
  fallbackLimiterStore.set(key, updated);
  return {
    ok: true,
    retryAfterSeconds: 0,
    remaining: Math.max(0, limit - updated.length),
  };
}

function isMissingRateLimitRpc(
  error: { code?: string | null; message?: string | null } | null
) {
  return error?.code === "PGRST202" || error?.message?.includes("consume_rate_limit");
}

export async function checkRateLimit(
  client: RateLimitClient,
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));
  const { data, error } = await client.rpc("consume_rate_limit", {
    p_action: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    if (isMissingRateLimitRpc(error)) {
      return fallbackRateLimit(key, limit, windowMs);
    }
    throw new Error(error.message ?? "Rate limit request failed");
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row.allowed !== "boolean") {
    return fallbackRateLimit(key, limit, windowMs);
  }

  if (!row.allowed) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Number(row.retry_after_seconds) || 1),
      remaining: 0,
    };
  }

  return {
    ok: true,
    retryAfterSeconds: 0,
    remaining: Math.max(0, Number(row.remaining) || 0),
  };
}
