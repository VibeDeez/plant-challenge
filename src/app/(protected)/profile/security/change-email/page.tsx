"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

export default function ChangeEmailPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/account/email-change/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setError(payload.error ?? "Unable to request email change");
        return;
      }

      setMessage(
        payload.message ??
          "Verification instructions sent. Complete email verification to finish this change."
      );
      setEmail("");
    } catch {
      setError("Unable to request email change");
    } finally {
      setLoading(false);
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
          <h1 className="mt-2 text-2xl font-display text-brand-cream">Change Email</h1>
          <p className="mt-1 text-sm text-brand-cream/60">
            Enter your new email address and confirm it from your inbox.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-4">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-brand-dark/10 bg-white/70 p-4"
        >
          <label htmlFor="email" className="text-sm font-medium text-brand-muted">
            New Email Address
          </label>
          <div className="relative mt-2">
            <Mail
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted/60"
            />
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="min-h-11 w-full rounded-xl border border-brand-dark/15 bg-white py-3 pl-9 pr-3 text-sm text-brand-dark placeholder:text-brand-muted/50 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 min-h-11 w-full rounded-xl bg-brand-green px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-green-hover disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send Verification Email"}
          </button>

          <p className="mt-3 text-xs text-brand-muted">
            Some providers require confirmation from both your old and new email addresses.
          </p>
        </form>

        {message && (
          <p className="mt-3 rounded-xl bg-brand-green/15 px-3 py-2.5 text-sm text-brand-dark">
            {message}
          </p>
        )}

        {error && (
          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
