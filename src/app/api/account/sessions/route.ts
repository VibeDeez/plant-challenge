import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRequestMeta } from "@/lib/account/requestMeta";

type SecurityEvent = {
  id: string;
  event_type: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const { user_agent } = getRequestMeta(request);

    const { data: eventRows, error: eventError } = await supabase
      .from("account_security_event")
      .select("id, event_type, created_at, metadata")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    const events: SecurityEvent[] = eventError
      ? []
      : (eventRows as SecurityEvent[] | null) ?? [];

    return NextResponse.json({
      currentSession: {
        userId: user.id,
        email: user.email ?? null,
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at,
        expiresAt: session?.expires_at ?? null,
        userAgent: user_agent,
      },
      limitations: {
        multiDeviceListing: false,
        reason:
          "Supabase client auth does not expose a full device session list without additional backend session tracking.",
      },
      recentSecurityActivity: events,
    });
  } catch (error) {
    console.error("Account sessions fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
