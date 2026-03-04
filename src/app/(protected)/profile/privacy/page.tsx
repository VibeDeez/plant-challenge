"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, ShieldAlert, Trash2 } from "lucide-react";

type ExportResponse = {
  ok: true;
  exportedAt: string;
  account: Record<string, unknown>;
  members: unknown[];
  plant_logs: unknown[];
};

function downloadJson(payload: unknown, fileName: string) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export default function PrivacyPage() {
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleExport() {
    setExporting(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/account/export", {
        method: "POST",
      });

      const payload = (await response.json()) as ExportResponse | { error?: string };

      if (!response.ok) {
        setError(payload && "error" in payload ? payload.error ?? "Unable to export data" : "Unable to export data");
        return;
      }

      const exportPayload = payload as ExportResponse;
      const stamp = new Date(exportPayload.exportedAt)
        .toISOString()
        .replace(/[:.]/g, "-");

      downloadJson(exportPayload, `plantmaxxing-account-export-${stamp}.json`);
      setMessage("Data export downloaded.");
    } catch {
      setError("Unable to export data");
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteRequest() {
    setDeleting(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmation: confirmText,
          reason,
        }),
      });

      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setError(payload.error ?? "Unable to request account deletion");
        return;
      }

      setMessage(
        payload.message ??
          "Account deletion request submitted. You will be signed out now."
      );

      setTimeout(() => {
        router.push("/auth");
        router.refresh();
      }, 1200);
    } catch {
      setError("Unable to request account deletion");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="bg-brand-dark px-page pt-6 pb-7 grain">
        <div className="max-w-lg mx-auto">
          <Link
            href="/profile"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-brand-cream/80 transition-colors hover:text-brand-cream"
          >
            <ArrowLeft size={16} />
            Back to Profile
          </Link>
          <h1 className="mt-2 text-2xl font-display text-brand-cream">Privacy & Data</h1>
          <p className="mt-1 text-sm text-brand-cream/60">
            Export your data and manage account lifecycle actions.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-4 stack-section">
        <div className="rounded-2xl border border-brand-dark/10 bg-white/70 p-4">
          <div className="flex items-center gap-2">
            <Download size={16} className="text-brand-dark" />
            <h2 className="text-base font-semibold text-brand-dark font-display">Export My Data</h2>
          </div>
          <p className="mt-2 text-sm text-brand-muted">
            Download a JSON export of your account profile, members, and plant logs.
          </p>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="mt-3 min-h-11 w-full rounded-xl bg-brand-green px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-green-hover disabled:opacity-60"
          >
            {exporting ? "Preparing export..." : "Download Export"}
          </button>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50/80 p-4">
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} className="text-red-700" />
            <h2 className="text-base font-semibold text-red-700 font-display">Delete Account</h2>
          </div>
          <p className="mt-2 text-sm text-red-700/90">
            This starts account deletion review and signs you out of all devices.
            Type <span className="font-semibold">DELETE</span> to confirm.
          </p>

          <label htmlFor="delete-confirm" className="mt-3 block text-xs font-semibold tracking-wide text-red-700/80 uppercase">
            Confirmation Text
          </label>
          <input
            id="delete-confirm"
            type="text"
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            placeholder="Type DELETE"
            className="mt-1 min-h-11 w-full rounded-xl border border-red-200 bg-white px-3 py-3 text-sm text-brand-dark placeholder:text-brand-muted/50 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-400"
          />

          <label htmlFor="delete-reason" className="mt-3 block text-xs font-semibold tracking-wide text-red-700/80 uppercase">
            Optional Reason
          </label>
          <textarea
            id="delete-reason"
            rows={3}
            maxLength={500}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Tell us why you are leaving"
            className="mt-1 w-full rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm text-brand-dark placeholder:text-brand-muted/50 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-400"
          />

          <button
            type="button"
            onClick={handleDeleteRequest}
            disabled={deleting || confirmText !== "DELETE"}
            data-haptic="warning"
            className="mt-3 min-h-11 w-full rounded-xl border border-red-300 bg-red-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="inline-flex items-center gap-2">
              <Trash2 size={14} />
              {deleting ? "Submitting..." : "Request Account Deletion"}
            </span>
          </button>
        </div>

        <div className="rounded-2xl border border-brand-dark/10 bg-white/60 p-4 text-sm text-brand-muted">
          <p>
            Account deletions currently require a support-side finalization step because
            auth credential deletion is handled in a protected backend environment.
          </p>
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
