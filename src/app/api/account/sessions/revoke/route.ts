import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/account/rateLimit";
import { logSecurityEvent } from "@/lib/account/securityEvents";

const WINDOW_MS = 5 * 60 * 1000;
const REQUEST_LIMIT = 5;

type RevokeScope = "others" | "global" | "local";

function parseScope(value: unknown): RevokeScope {
  if (value === "global" || value === "local") return value;
  return "others";
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limiterKey = `session-revoke:${user.id}`;
    const limit = checkRateLimit(limiterKey, REQUEST_LIMIT, WINDOW_MS);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many revoke requests. Please try again shortly." },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfterSeconds) },
        }
      );
    }

    let body: unknown = null;
    try {
      body = await request.json();
    } catch {
      body = null;
    }

    const scopeInput =
      typeof body === "object" && body && "scope" in body
        ? (body as { scope?: unknown }).scope
        : undefined;

    const scope = parseScope(scopeInput);

    const { error } = await supabase.auth.signOut({ scope });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logSecurityEvent(supabase, request, user.id, "sessions_revoked", {
      scope,
    });

    return NextResponse.json({
      ok: true,
      scope,
      message:
        scope === "global"
          ? "Signed out from all devices."
          : scope === "local"
            ? "Signed out from this device."
            : "Signed out from other devices.",
    });
  } catch (error) {
    console.error("Session revoke error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
