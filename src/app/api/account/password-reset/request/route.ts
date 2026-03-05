import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/account/rateLimit";
import { getRequestOrigin } from "@/lib/account/requestMeta";
import { logSecurityEvent } from "@/lib/account/securityEvents";

const WINDOW_MS = 10 * 60 * 1000;
const REQUEST_LIMIT = 3;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.email) {
      return NextResponse.json(
        { error: "No email found for this account" },
        { status: 400 }
      );
    }

    const limiterKey = `pw-reset:${user.id}`;
    const limit = await checkRateLimit(supabase, limiterKey, REQUEST_LIMIT, WINDOW_MS);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many reset requests. Please try again shortly." },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfterSeconds) },
        }
      );
    }

    const origin = getRequestOrigin(request);
    const redirectTo = `${origin}/auth/callback?next=/auth/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logSecurityEvent(supabase, request, user.id, "password_reset_requested", {
      redirect_to: redirectTo,
    });

    return NextResponse.json({
      ok: true,
      message: "Password reset email sent",
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
