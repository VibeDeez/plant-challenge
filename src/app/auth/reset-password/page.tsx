"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const supabase = createClient();

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) throw updateError;
      setSuccess(true);
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-brand-cream grain-light flex items-center justify-center px-6">
      <div className="fixed top-0 left-0 right-0 z-[60] bg-brand-dark h-safe-top" />

      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-brand-dark text-center mb-2 font-display">
          Set New Password
        </h1>
        <p className="text-center text-brand-muted mb-8">
          Enter your new password below.
        </p>

        <div className="rounded-2xl border border-brand-dark/10 bg-white/30 backdrop-blur-sm p-6">
          {success ? (
            <div className="text-center py-4">
              <p className="text-sm font-semibold text-brand-green mb-1">
                Password updated!
              </p>
              <p className="text-sm text-brand-muted">
                Redirecting you to the app...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-brand-muted mb-1"
                >
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl border border-brand-dark/10 bg-white px-4 py-3 text-sm text-brand-dark placeholder:text-brand-muted/50 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-green"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-brand-muted mb-1"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full rounded-xl border border-brand-dark/10 bg-white px-4 py-3 text-sm text-brand-dark placeholder:text-brand-muted/50 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-green"
                />
              </div>

              {error && (
                <p className="text-sm text-red-700 bg-red-50 rounded-xl px-4 py-2.5">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-brand-green px-4 py-3 text-sm font-semibold text-white hover:bg-brand-green-hover disabled:opacity-50 transition-colors"
              >
                {loading ? "..." : "Update Password"}
              </button>
            </form>
          )}
        </div>

        {!success && (
          <p className="mt-5 text-center text-sm text-brand-muted">
            <a
              href="/auth"
              className="font-semibold text-brand-dark hover:text-brand-green transition-colors"
            >
              Back to sign in
            </a>
          </p>
        )}
      </div>
    </main>
  );
}
