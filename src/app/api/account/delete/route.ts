import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/account/rateLimit";
import { logSecurityEvent } from "@/lib/account/securityEvents";

const WINDOW_MS = 24 * 60 * 60 * 1000;
const REQUEST_LIMIT = 2;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limiterKey = `account-delete:${user.id}`;
    const limit = await checkRateLimit(supabase, limiterKey, REQUEST_LIMIT, WINDOW_MS);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many deletion requests. Please try again tomorrow." },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfterSeconds) },
        }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const confirmation =
      typeof body === "object" && body && "confirmation" in body
        ? (body as { confirmation?: unknown }).confirmation
        : undefined;

    const reason =
      typeof body === "object" && body && "reason" in body
        ? (body as { reason?: unknown }).reason
        : undefined;

    if (confirmation !== "DELETE") {
      return NextResponse.json(
        { error: 'Please type "DELETE" to confirm account deletion.' },
        { status: 400 }
      );
    }

    // Optional table: queue deletion request when table exists.
    try {
      await supabase.from("account_deletion_request").insert({
        user_id: user.id,
        email: user.email ?? null,
        status: "pending",
        reason: typeof reason === "string" ? reason.slice(0, 500) : null,
      });
    } catch {
      // Keep endpoint functional without optional table.
    }

    await logSecurityEvent(supabase, request, user.id, "account_delete_requested", {
      has_reason: typeof reason === "string" && reason.trim().length > 0,
    });

    // Service-role key is not configured in this project, so we queue and sign out.
    await supabase.auth.signOut({ scope: "global" });

    return NextResponse.json({
      ok: true,
      message:
        "Account deletion requested. You have been signed out, and support review is required to fully remove authentication credentials.",
      requiresManualReview: true,
    });
  } catch (error) {
    console.error("Account delete request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
