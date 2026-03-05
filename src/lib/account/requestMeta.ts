import { createHash } from "crypto";
import type { NextRequest } from "next/server";

function getClientIp(request: NextRequest): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();

  return null;
}

export function getRequestMeta(request: NextRequest) {
  const clientIp = getClientIp(request);

  return {
    ip_hash: clientIp
      ? createHash("sha256").update(clientIp).digest("hex")
      : null,
    user_agent: request.headers.get("user-agent") ?? null,
  };
}

export function getRequestOrigin(request: NextRequest): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (siteUrl) return siteUrl.replace(/\/$/, "");

  return new URL(request.url).origin;
}
