"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Smartphone, LogOut } from "lucide-react";

type ActivityItem = {
  id: string;
  event_type: string;
  created_at: string;
};

type SessionResponse = {
  currentSession: {
    email: string | null;
    createdAt: string | null;
    lastSignInAt: string | null;
    userAgent: string | null;
    expiresAt: number | null;
  };
  limitations: {
    multiDeviceListing: boolean;
    reason: string;
  };
  recentSecurityActivity: ActivityItem[];
};

function formatDate(value: string | null): string {
  if (!value) return "Unknown";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatExpires(epochSeconds: number | null): string {
  if (!epochSeconds) return "Unknown";
  return formatDate(new Date(epochSeconds * 1000).toISOString());
}

export default function SessionSettingsPage() {
  const [data, setData] = useState<SessionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState<"others" | "global" | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/account/sessions", {
        method: "GET",
        cache: "no-store",
      });

      const payload = (await response.json()) as
        | SessionResponse
        | { error?: string };

      if (!response.ok) {
        setError(payload && "error" in payload ? payload.error ?? "Unable to load session details" : "Unable to load session details");
        return;
      }

      setData(payload as SessionResponse);
    } catch {
      setError("Unable to load session details");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function revoke(scope: "others" | "global") {
    setWorking(scope);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/account/sessions/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope }),
      });

      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setError(payload.error ?? "Unable to revoke sessions");
        return;
      }

      setMessage(payload.message ?? "Session action complete.");
      await fetchData();
    } catch {
      setError("Unable to revoke sessions");
    } finally {
      setWorking(null);
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="bg-brand-dark px-page pt-6 pb-7 grain">
        <div className="max-w-lg mx-auto">
          <Link
            href="/profile/security"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-brand-cream/80 transition-colors hover:text-brand-cream"
          >
            <ArrowLeft size={16} />
            Back to Security
          </Link>
          <h1 className="mt-2 text-2xl font-display text-brand-cream">Sessions & Devices</h1>
          <p className="mt-1 text-sm text-brand-cream/60">
            Review your active session and sign out when needed.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-4 stack-section">
        {loading ? (
          <div className="rounded-2xl border border-brand-dark/10 bg-white/60 p-4">
            <p className="text-sm text-brand-muted">Loading session details...</p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-brand-dark/10 bg-white/60 p-4">
              <div className="flex items-center gap-2">
                <Smartphone size={16} className="text-brand-dark" />
                <h2 className="text-base font-semibold text-brand-dark font-display">Current Device</h2>
              </div>

              <div className="mt-3 space-y-2 text-sm text-brand-muted">
                <p><span className="font-medium text-brand-dark">Email:</span> {data?.currentSession.email ?? "Unknown"}</p>
                <p><span className="font-medium text-brand-dark">Signed in:</span> {formatDate(data?.currentSession.lastSignInAt ?? null)}</p>
                <p><span className="font-medium text-brand-dark">Session expires:</span> {formatExpires(data?.currentSession.expiresAt ?? null)}</p>
                <p className="break-words"><span className="font-medium text-brand-dark">Device:</span> {data?.currentSession.userAgent ?? "Unknown"}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-brand-dark/10 bg-white/60 p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-brand-dark" />
                <h2 className="text-base font-semibold text-brand-dark font-display">Session Actions</h2>
              </div>

              <button
                type="button"
                onClick={() => revoke("others")}
                disabled={working !== null}
                className="mt-3 min-h-11 w-full rounded-xl bg-brand-green px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-green-hover disabled:opacity-60"
              >
                {working === "others" ? "Working..." : "Sign Out Other Devices"}
              </button>

              <button
                type="button"
                onClick={() => revoke("global")}
                disabled={working !== null}
                className="mt-2 min-h-11 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-60"
              >
                <span className="inline-flex items-center gap-2">
                  <LogOut size={14} />
                  {working === "global" ? "Working..." : "Sign Out All Devices"}
                </span>
              </button>

              <p className="mt-3 text-xs text-brand-muted">
                {data?.limitations.reason}
              </p>
            </div>
          </>
        )}

        {message && (
          <p className="rounded-xl bg-brand-green/15 px-3 py-2.5 text-sm text-brand-dark">
            {message}
          </p>
        )}

        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
