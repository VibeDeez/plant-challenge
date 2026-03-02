"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  KeyRound,
  Mail,
  Shield,
  Smartphone,
  ExternalLink,
} from "lucide-react";

type ActivityItem = {
  id: string;
  event_type: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

type SessionSummary = {
  currentSession: {
    email: string | null;
    lastSignInAt: string | null;
  };
  recentSecurityActivity: ActivityItem[];
};

function formatTimestamp(value: string | null): string {
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

function eventLabel(type: string): string {
  switch (type) {
    case "password_reset_requested":
      return "Password reset requested";
    case "email_change_requested":
      return "Email change requested";
    case "sessions_revoked":
      return "Sessions revoked";
    case "account_delete_requested":
      return "Account deletion requested";
    case "data_export_requested":
      return "Data export requested";
    default:
      return type.replace(/_/g, " ");
  }
}

export default function SecuritySettingsPage() {
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingReset, setSendingReset] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/account/sessions", {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await response.json()) as
        | SessionSummary
        | { error?: string };

      if (!response.ok) {
        setError(payload && "error" in payload ? payload.error ?? "Unable to load security details" : "Unable to load security details");
        return;
      }

      setSummary(payload as SessionSummary);
    } catch {
      setError("Unable to load security details");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const activity = useMemo(
    () => summary?.recentSecurityActivity ?? [],
    [summary]
  );

  async function handleSendPasswordReset() {
    setSendingReset(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/account/password-reset/request", {
        method: "POST",
      });
      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setError(payload.error ?? "Unable to request password reset email");
        return;
      }

      setMessage(
        payload.message ?? "Check your email for a secure password reset link."
      );
      await fetchSummary();
    } catch {
      setError("Unable to request password reset email");
    } finally {
      setSendingReset(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="bg-brand-dark px-page pt-6 pb-7 grain">
        <div className="max-w-lg mx-auto">
          <Link
            href="/profile"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-medium text-brand-cream/80 transition-colors hover:text-brand-cream"
          >
            <ArrowLeft size={16} />
            Back to Profile
          </Link>
          <h1 className="mt-2 text-2xl font-display text-brand-cream">Security</h1>
          <p className="mt-1 text-sm text-brand-cream/60">
            Manage sign-in protection and account access.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-4 stack-section">
        <div className="rounded-2xl border border-brand-dark/10 bg-white/60 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-xl bg-brand-green/15 p-2.5">
              <KeyRound size={18} className="text-brand-dark" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-brand-dark font-display">
                Change Password
              </h2>
              <p className="mt-1 text-sm text-brand-muted">
                We will email a secure reset link to your current account email.
              </p>
              <button
                type="button"
                onClick={handleSendPasswordReset}
                disabled={sendingReset}
                className="mt-3 min-h-11 w-full rounded-xl bg-brand-green px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-green-hover disabled:opacity-60"
              >
                {sendingReset ? "Sending..." : "Send Reset Link"}
              </button>
            </div>
          </div>
        </div>

        <Link
          href="/profile/security/change-email"
          className="rounded-2xl border border-brand-dark/10 bg-white/60 p-4 transition-colors hover:bg-white"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-brand-dark/5 p-2.5">
              <Mail size={18} className="text-brand-dark" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-brand-dark font-display">Change Email</p>
              <p className="text-sm text-brand-muted break-all">
                Current: {summary?.currentSession.email ?? "Unknown"}
              </p>
            </div>
            <ExternalLink size={16} className="text-brand-muted" />
          </div>
        </Link>

        <Link
          href="/profile/security/sessions"
          className="rounded-2xl border border-brand-dark/10 bg-white/60 p-4 transition-colors hover:bg-white"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-brand-dark/5 p-2.5">
              <Smartphone size={18} className="text-brand-dark" />
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold text-brand-dark font-display">Sessions & Devices</p>
              <p className="text-sm text-brand-muted">View and revoke active sessions.</p>
            </div>
            <ExternalLink size={16} className="text-brand-muted" />
          </div>
        </Link>

        <div className="rounded-2xl border border-brand-dark/10 bg-white/60 p-4">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-brand-dark" />
            <h2 className="text-base font-semibold text-brand-dark font-display">
              Recent Activity
            </h2>
          </div>

          {loading ? (
            <p className="mt-3 text-sm text-brand-muted">Loading activity...</p>
          ) : activity.length === 0 ? (
            <p className="mt-3 text-sm text-brand-muted">No recent security events yet.</p>
          ) : (
            <div className="mt-3 stack-card">
              {activity.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-brand-dark/10 bg-brand-cream/40 px-3 py-2.5"
                >
                  <p className="text-sm font-medium text-brand-dark capitalize">
                    {eventLabel(item.event_type)}
                  </p>
                  <p className="text-xs text-brand-muted mt-0.5">
                    {formatTimestamp(item.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {summary?.currentSession.lastSignInAt && (
            <p className="mt-3 text-xs text-brand-muted">
              Last sign-in: {formatTimestamp(summary.currentSession.lastSignInAt)}
            </p>
          )}
        </div>

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
