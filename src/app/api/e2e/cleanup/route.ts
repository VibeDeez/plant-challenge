import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (process.env.E2E_TEST !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const errors: string[] = [];

  // Get the test user's member IDs (owner + kids)
  const { data: members } = await supabase
    .from("member")
    .select("id, is_owner")
    .eq("user_id", user.id);

  const memberIds = (members ?? []).map((m) => m.id);

  // Delete plant logs for all members belonging to this user
  if (body.plant_logs && memberIds.length > 0) {
    const { error } = await supabase
      .from("plant_log")
      .delete()
      .in("member_id", memberIds);
    if (error) errors.push(`plant_logs: ${error.message}`);
  }

  // Delete circles where the test user is admin
  if (body.circles && memberIds.length > 0) {
    // First remove circle memberships for test user's members
    const { error: cmError } = await supabase
      .from("circle_member")
      .delete()
      .in("member_id", memberIds);
    if (cmError) errors.push(`circle_member: ${cmError.message}`);

    // Then delete circles administered by test user's members
    const { error: cError } = await supabase
      .from("circle")
      .delete()
      .in("admin_id", memberIds);
    if (cError) errors.push(`circle: ${cError.message}`);
  }

  // Delete non-owner members (kids)
  if (body.kids) {
    const { error } = await supabase
      .from("member")
      .delete()
      .eq("user_id", user.id)
      .eq("is_owner", false);
    if (error) errors.push(`kids: ${error.message}`);
  }

  // Restore the owner's display name to "Me"
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
