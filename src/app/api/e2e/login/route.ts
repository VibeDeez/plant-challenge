import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { isE2ERouteBlocked } from "@/lib/api/e2eGuard";

export async function GET(request: NextRequest) {
  if (
    isE2ERouteBlocked({
      nodeEnv: process.env.NODE_ENV,
      e2eTest: process.env.E2E_TEST,
    })
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;
  if (!email || !password) {
    return NextResponse.json(
      { error: "Test credentials not configured" },
      { status: 500 }
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  return NextResponse.redirect(new URL("/", request.url));
}
