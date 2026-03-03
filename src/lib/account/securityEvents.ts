import type { NextRequest } from "next/server";
import { getRequestMeta } from "@/lib/account/requestMeta";

type SecurityEventType =
  | "password_reset_requested"
  | "email_change_requested"
  | "sessions_revoked"
  | "account_delete_requested"
  | "data_export_requested";

type InsertClient = {
  from: (table: string) => {
    insert: (payload: Record<string, unknown>) => PromiseLike<unknown>;
  };
};

export async function logSecurityEvent(
  supabase: InsertClient,
  request: NextRequest,
  userId: string,
  eventType: SecurityEventType,
  metadata: Record<string, unknown> = {}
) {
  const requestMeta = getRequestMeta(request);

  try {
    await supabase.from("account_security_event").insert({
      user_id: userId,
      event_type: eventType,
      ip_hash: requestMeta.ip_hash,
      user_agent: requestMeta.user_agent,
      metadata,
    });
  } catch {
    // Optional table: keep endpoints functional even when this table is not present.
  }
}
