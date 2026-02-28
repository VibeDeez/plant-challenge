import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { isE2ERouteBlocked } from "@/lib/api/e2eGuard";

type CleanupBody = {
  plant_logs: boolean;
  circles: boolean;
  kids: boolean;
  restore_owner_name: boolean;
};

function parseCleanupBody(input: unknown): CleanupBody {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {
      plant_logs: false,
      circles: false,
      kids: false,
      restore_owner_name: false,
    };
  }

  const body = input as Record<string, unknown>;
  return {
    plant_logs: body.plant_logs === true,
    circles: body.circles === true,
    kids: body.kids === true,
    restore_owner_name: body.restore_owner_name === true,
  };
}

export async function POST(request: NextRequest) {
  if (
    isE2ERouteBlocked({
      nodeEnv: process.env.NODE_ENV,
      e2eTest: process.env.E2E_TEST,
    })
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let rawBody: unknown = {};
  const contentLength = request.headers.get("content-length");
  const hasBody = contentLength !== "0";
  if (hasBody) {
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
  }

  const body = parseCleanupBody(rawBody);
  const errors: string[] = [];

  const { data: members } = await supabase
    .from("member")
    .select("id, is_owner")
    .eq("user_id", user.id);

  const memberIds = (members ?? []).map((m) => m.id);

  if (body.plant_logs && memberIds.length > 0) {
    const { error } = await supabase
      .from("plant_log")
      .delete()
      .in("member_id", memberIds);
    if (error) errors.push(`plant_logs: ${error.message}`);
  }

  if (body.circles && memberIds.length > 0) {
    const { error: cmError } = await supabase
      .from("circle_member")
      .delete()
      .in("member_id", memberIds);
    if (cmError) errors.push(`circle_member: ${cmError.message}`);

    const { error: cError } = await supabase
      .from("circle")
      .delete()
      .in("admin_id", memberIds);
    if (cError) errors.push(`circle: ${cError.message}`);
  }

  if (body.kids) {
    const { error } = await supabase
      .from("member")
      .delete()
      .eq("user_id", user.id)
      .eq("is_owner", false);
    if (error) errors.push(`kids: ${error.message}`);
  }

  if (body.restore_owner_name) {
    const owner = (members ?? []).find((m) => m.is_owner);
    if (owner) {
      const { error } = await supabase
        .from("member")
        .update({ display_name: "Me" })
        .eq("id", owner.id);
      if (error) errors.push(`restore_owner_name: ${error.message}`);
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ ok: false, errors }, { status: 207 });
  }

  return NextResponse.json({ ok: true });
}
