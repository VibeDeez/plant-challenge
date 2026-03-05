"use server";

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_REDIRECTS = 3;
const ALLOWED_CONTENT_TYPES = [
  "text/html",
  "text/plain",
  "application/xhtml+xml",
];

function isPrivateIpv4(address: string): boolean {
  const octets = address.split(".").map((part) => Number(part));
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part))) {
    return true;
  }

  const [a, b, c] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

function isPrivateIpv6(address: string): boolean {
  const normalized = address.toLowerCase();
  if (normalized === "::" || normalized === "::1") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  if (normalized.startsWith("fe8") || normalized.startsWith("fe9")) return true;
  if (normalized.startsWith("fea") || normalized.startsWith("feb")) return true;
  if (normalized.startsWith("2001:db8:")) return true;
  if (normalized.startsWith("::ffff:")) {
    return isPrivateIp(normalized.slice("::ffff:".length));
  }
  return false;
}

function isPrivateIp(address: string): boolean {
  const version = isIP(address);
  if (version === 4) return isPrivateIpv4(address);
  if (version === 6) return isPrivateIpv6(address);
  return true;
}

function hasSafePort(url: URL): boolean {
  if (!url.port) return true;
  return url.port === "80" || url.port === "443";
}

function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "localhost" ||
    normalized === "0.0.0.0" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal") ||
    normalized.endsWith(".localdomain")
  );
}

async function resolveSafeUrl(url: URL): Promise<URL | null> {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return null;
  }

  if (!hasSafePort(url) || url.username || url.password) {
    return null;
  }

  if (isBlockedHostname(url.hostname)) {
    return null;
  }

  if (isIP(url.hostname) && isPrivateIp(url.hostname)) {
    return null;
  }

  try {
    const addresses = await lookup(url.hostname, { all: true, verbatim: true });
    if (addresses.length === 0) return null;
    if (addresses.some(({ address }) => isPrivateIp(address))) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

function assertReadableContentType(response: Response) {
  const contentType = response.headers.get("content-type");
  if (!contentType) return;

  const normalized = contentType.toLowerCase();
  if (ALLOWED_CONTENT_TYPES.some((value) => normalized.includes(value))) {
    return;
  }

  throw new Error("UNSUPPORTED_REMOTE_CONTENT_TYPE");
}

async function readTextResponseWithLimit(
  response: Response,
  maxBytes: number
): Promise<string> {
  const contentLength = Number(response.headers.get("content-length") ?? "");
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new Error("REMOTE_RESPONSE_TOO_LARGE");
  }

  const reader = response.body?.getReader();
  if (!reader) {
    return await response.text();
  }

  const decoder = new TextDecoder();
  let totalBytes = 0;
  let text = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (!value) continue;

    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      throw new Error("REMOTE_RESPONSE_TOO_LARGE");
    }

    text += decoder.decode(value, { stream: true });
  }

  text += decoder.decode();
  return text;
}

export async function fetchSafeRemoteText(
  input: string,
  options: {
    timeoutMs: number;
    maxBytes: number;
    userAgent: string;
  }
): Promise<{ text: string; finalUrl: string }> {
  let currentUrl = await resolveSafeUrl(new URL(input));
  if (!currentUrl) {
    throw new Error("UNSAFE_REMOTE_URL");
  }

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

    try {
      const response = await fetch(currentUrl.toString(), {
        method: "GET",
        headers: {
          "User-Agent": options.userAgent,
          Accept: "text/html,text/plain,application/xhtml+xml",
        },
        redirect: "manual",
        signal: controller.signal,
      });

      if (
        response.status === 301 ||
        response.status === 302 ||
        response.status === 303 ||
        response.status === 307 ||
        response.status === 308
      ) {
        const location = response.headers.get("location");
        if (!location || redirectCount === MAX_REDIRECTS) {
          throw new Error("REMOTE_REDIRECT_BLOCKED");
        }

        const nextUrl = await resolveSafeUrl(new URL(location, currentUrl));
        if (!nextUrl) {
          throw new Error("UNSAFE_REMOTE_URL");
        }

        currentUrl = nextUrl;
        continue;
      }

      if (!response.ok) {
        throw new Error(`REMOTE_STATUS_${response.status}`);
      }

      assertReadableContentType(response);
      const text = await readTextResponseWithLimit(response, options.maxBytes);
      return { text, finalUrl: currentUrl.toString() };
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error("REMOTE_REDIRECT_BLOCKED");
}
