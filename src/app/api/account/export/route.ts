import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/account/rateLimit";
import { logSecurityEvent } from "@/lib/account/securityEvents";

const WINDOW_MS = 60 * 60 * 1000;
const REQUEST_LIMIT = 3;

type MemberRecord = {
  id: string;
  display_name: string;
  avatar_emoji: string;
  is_owner: boolean;
  created_at: string;
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limiterKey = `account-export:${user.id}`;
    const limit = checkRateLimit(limiterKey, REQUEST_LIMIT, WINDOW_MS);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many export requests. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfterSeconds) },
        }
      );
    }

    let exportRequestId: string | null = null;
    try {
      const { data: requestRow } = await supabase
        .from("account_export_request")
        .insert({
          user_id: user.id,
          status: "requested",
          metadata: {
            trigger: "in_app_download",
          },
        })
        .select("id")
        .single();
      exportRequestId = (requestRow as { id?: string } | null)?.id ?? null;
    } catch {
      // Optional table fallback.
    }

    const { data: members, error: memberError } = await supabase
      .from("member")
      .select("id, display_name, avatar_emoji, is_owner, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 400 });
    }

    const memberIds = ((members as MemberRecord[] | null) ?? []).map((m) => m.id);

    const { data: plantLogs, error: logsError } = await supabase
      .from("plant_log")
      .select("id, member_id, plant_name, category, points, week_start, logged_at")
      .in("member_id", memberIds.length > 0 ? memberIds : ["00000000-0000-0000-0000-000000000000"])
      .order("logged_at", { ascending: false });

    if (logsError) {
      return NextResponse.json({ error: logsError.message }, { status: 400 });
    }

    if (exportRequestId) {
      await supabase
        .from("account_export_request")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          metadata: {
            trigger: "in_app_download",
            member_count: memberIds.length,
            log_count: (plantLogs ?? []).length,
          },
        })
        .eq("id", exportRequestId);
    }

    await logSecurityEvent(supabase, request, user.id, "data_export_requested", {
      member_count: memberIds.length,
      log_count: (plantLogs ?? []).length,
    });

    return NextResponse.json({
      ok: true,
      exportedAt: new Date().toISOString(),
      account: {
        user_id: user.id,
        email: user.email ?? null,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
      },
      members: members ?? [],
      plant_logs: plantLogs ?? [],
    });
  } catch (error) {
    console.error("Account export request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
