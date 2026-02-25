"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/components/ProtectedLayout";
import { generateInviteCode, getShareUrl, isValidCircleId } from "@/lib/circles";
import Link from "next/link";
import { ArrowLeft, Copy, Share2, ArrowRight, Check } from "lucide-react";

const supabase = createClient();

type CreatedCircle = {
  id: string;
  name: string;
  invite_code: string;
};

function isCreatedCirclePayload(data: unknown): data is CreatedCircle {
  if (!data || typeof data !== "object") return false;
  const maybe = data as Partial<CreatedCircle>;
  return (
    isValidCircleId(maybe.id) &&
    typeof maybe.name === "string" &&
    maybe.name.trim().length > 0 &&
    typeof maybe.invite_code === "string" &&
    maybe.invite_code.trim().length > 0
  );
}

export default function CircleCreatePage() {
  const { activeMember } = useApp();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<CreatedCircle | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeMember || !name.trim()) return;
    setCreating(true);
    setError("");

    let circle: CreatedCircle | null = null;
    let attempts = 0;
    const MAX_ATTEMPTS = 3;

    while (!circle && attempts < MAX_ATTEMPTS) {
      attempts++;
      const code = generateInviteCode();

      const { data, error: insertError } = await supabase
        .from("circle")
        .insert({
          name: name.trim(),
          invite_code: code,
          admin_id: activeMember.id,
        })
        .select()
        .single();

      if (insertError) {
        // Unique violation on invite_code — retry
        if (
          insertError.code === "23505" &&
          insertError.message?.includes("invite_code")
        ) {
          continue;
        }
        setError(insertError.message || "Failed to create circle");
        setCreating(false);
        return;
      }

      if (!isCreatedCirclePayload(data)) {
        setError("Circle was created, but the response was invalid. Please try again.");
        setCreating(false);
        return;
      }

      circle = { id: data.id, name: data.name, invite_code: data.invite_code };
    }

    if (!circle) {
      setError("Could not generate a unique invite code. Please try again.");
      setCreating(false);
      return;
    }

    // Add creator as a member
    const { error: memberError } = await supabase
      .from("circle_member")
      .insert({ circle_id: circle.id, member_id: activeMember.id });

    if (memberError) {
      setError(memberError.message || "Circle created but failed to join it");
      setCreating(false);
      return;
    }

    setCreated(circle);
    setCreating(false);
  }

  async function handleCopy() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(getShareUrl(created.invite_code));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: some browsers block clipboard outside secure context
      setCopied(false);
    }
  }

  async function handleShare() {
    if (!created) return;
    const url = getShareUrl(created.invite_code);
    const shareData = {
      title: `Join ${created.name} on Placeholder`,
      text: `Join my Crop Circle "${created.name}" and compete on weekly plant leaderboards! Use code: ${created.invite_code}`,
      url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or share failed — fall back to copy
        handleCopy();
      }
    } else {
      handleCopy();
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg grain-light">
      <div className="max-w-lg mx-auto px-5 py-6">
        {/* Back link */}
        <Link
          href="/circles"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-muted hover:text-brand-dark transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Back to Circles
        </Link>

        {!created ? (
          /* --- CREATE FORM --- */
          <div>
            <h1 className="text-2xl font-bold text-brand-dark font-display mb-6">
              Create a Crop Circle
            </h1>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="circle-name"
                  className="block text-sm font-medium text-brand-dark mb-1.5"
                >
                  Circle Name
                </label>
                <input
                  id="circle-name"
                  type="text"
                  maxLength={50}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. The Plant Squad"
                  required
                  className="w-full bg-white rounded-xl border border-brand-dark/20 px-4 py-3 text-brand-dark focus:ring-2 focus:ring-brand-green focus:border-transparent focus:outline-none transition-all"
                  autoFocus
                />
                <p className="mt-1.5 text-xs text-brand-muted">
                  {name.length}/50 characters
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={!name.trim() || creating}
                className="w-full rounded-xl bg-brand-green px-4 py-3 text-sm font-semibold text-white hover:bg-brand-green-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </form>
          </div>
        ) : (
          /* --- SHARE OVERLAY --- */
          <div className="text-center animate-fadeInUp">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-green/10">
              <Check size={28} className="text-brand-green" strokeWidth={2} />
            </div>

            <h1 className="text-2xl font-bold text-brand-dark font-display mb-2">
              Your Crop Circle is ready!
            </h1>

            <p className="text-base text-brand-dark font-display mb-6">
              {created.name}
            </p>

            {/* Invite code display */}
            <div className="bg-white/30 backdrop-blur-sm rounded-2xl border border-brand-dark/10 p-6 mb-6">
              <p className="text-xs text-brand-muted uppercase tracking-wider mb-2">
                Invite Code
              </p>
              <p className="font-mono text-3xl tracking-widest text-brand-green font-bold">
                {created.invite_code}
              </p>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-brand-dark/10 bg-white/50 px-4 py-3 text-sm font-semibold text-brand-dark hover:bg-white/80 transition-colors"
              >
                {copied ? (
                  <>
                    <Check size={16} className="text-brand-green" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copy Link
                  </>
                )}
              </button>

              <button
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-green px-4 py-3 text-sm font-semibold text-white hover:bg-brand-green-hover transition-colors"
              >
                <Share2 size={16} />
                Share
              </button>

              <Link
                href={`/circles/${created.id}`}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-brand-dark/10 px-4 py-3 text-sm font-semibold text-brand-dark hover:bg-brand-dark/5 transition-colors"
              >
                Go to Circle
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
