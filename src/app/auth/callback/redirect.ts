const LOCAL_ORIGIN = "http://localhost";

export function sanitizeRedirectPath(nextPath: string | null): string {
  if (!nextPath) {
    return "/";
  }

  const candidate = nextPath.trim();
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return "/";
  }

  let decoded: string;
  try {
    decoded = decodeURIComponent(candidate);
  } catch {
    return "/";
  }

  if (!decoded.startsWith("/") || decoded.startsWith("//")) {
    return "/";
  }

  try {
    const parsed = new URL(candidate, LOCAL_ORIGIN);
    if (parsed.origin !== LOCAL_ORIGIN) {
      return "/";
    }

    if (!parsed.pathname.startsWith("/") || parsed.pathname.startsWith("//")) {
      return "/";
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/";
  }
}
