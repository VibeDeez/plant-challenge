import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/account/rateLimit";
import { getRequestOrigin } from "@/lib/account/requestMeta";
import { logSecurityEvent } from "@/lib/account/securityEvents";

const WINDOW_MS = 30 * 60 * 1000;
const REQUEST_LIMIT = 3;

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const rawEmail =
      typeof body === "object" && body && "email" in body
        ? (body as { email?: unknown }).email
        : null;

    if (typeof rawEmail !== "string") {
      return NextResponse.json(
        { error: "email is required" },
        { status: 400 }
      );
    }

    const nextEmail = normalizeEmail(rawEmail);

    if (!isValidEmail(nextEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    if (!user.email) {
      return NextResponse.json(
        { error: "No existing email found for this account" },
        { status: 400 }
      );
    }

    if (normalizeEmail(user.email) === nextEmail) {
      return NextResponse.json(
        { error: "That is already your current email" },
        { status: 400 }
      );
    }

    const limiterKey = `email-change:${user.id}`;
    const limit = await checkRateLimit(supabase, limiterKey, REQUEST_LIMIT, WINDOW_MS);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many email change requests. Please try again shortly." },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfterSeconds) },
        }
      );
    }

    const origin = getRequestOrigin(request);
    const emailRedirectTo = `${origin}/auth/callback?next=/profile/security`;

    const { error } = await supabase.auth.updateUser(
      { email: nextEmail },
      { emailRedirectTo }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logSecurityEvent(supabase, request, user.id, "email_change_requested", {
      current_email: user.email,
      requested_email: nextEmail,
      email_redirect_to: emailRedirectTo,
    });

    return NextResponse.json({
      ok: true,
      message: "Verification email sent. Please confirm both inboxes if prompted.",
    });
  } catch (error) {
    console.error("Email change request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
