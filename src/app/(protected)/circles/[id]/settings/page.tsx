"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/components/ProtectedLayout";
import { getShareUrl, generateInviteCode } from "@/lib/circles";
import type { Circle } from "@/lib/types/circle";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Check,
  X,
  AlertTriangle,
  ChevronDown,
  RefreshCw,
} from "lucide-react";

const supabase = createClient();

type MemberRow = {
  id: string;
  circle_id: string;
  member_id: string;
  joined_at: string;
  member: {
    id: string;
    display_name: string;
    avatar_emoji: string;
  };
};

export default function CircleSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const { activeMember } = useApp();
  const circleId = params.id as string;

  const [circle, setCircle] = useState<Circle | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  // Section 1: Circle Name
  const [editName, setEditName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  // Section 2: Invite Code
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Section 4: Transfer Admin
  const [transferTargetId, setTransferTargetId] = useState("");
  const [transferring, setTransferring] = useState(false);

  // Section 5: Danger Zone
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTyped, setDeleteTyped] = useState("");
  const [deleting, setDeleting] = useState(false);

  const fetchMembers = useCallback(async () => {
    const { data } = await supabase
      .from("circle_member")
      .select("*, member:member_id(id, display_name, avatar_emoji)")
      .eq("circle_id", circleId);

    if (data) {
      setMembers(data as unknown as MemberRow[]);
    }
  }, [circleId]);

  useEffect(() => {
    async function init() {
      if (!activeMember) return;

      const { data: circleData } = await supabase
        .from("circle")
        .select("*")
        .eq("id", circleId)
        .single();

      if (!circleData) {
        router.replace(`/circles/${circleId}`);
        return;
      }

      if (circleData.admin_id !== activeMember.id) {
        router.replace(`/circles/${circleId}`);
        return;
      }

      setCircle(circleData as Circle);
      setEditName(circleData.name);
      setAuthorized(true);
      await fetchMembers();
      setLoading(false);
    }

    init();
  }, [activeMember, circleId, router, fetchMembers]);

  // --- Handlers ---

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!editName.trim() || savingName) return;
    setSavingName(true);

    const { error } = await supabase
      .from("circle")
      .update({ name: editName.trim() })
      .eq("id", circleId);

    if (!error) {
      setCircle((prev) => (prev ? { ...prev, name: editName.trim() } : prev));
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
    }
    setSavingName(false);
  }

  async function handleCopyLink() {
    if (!circle) return;
    try {
      await navigator.clipboard.writeText(getShareUrl(circle.invite_code));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }

  async function handleRegenerate() {
    if (!circle || regenerating) return;
    if (!confirm("Generate a new invite code? The current code will stop working.")) return;
    setRegenerating(true);

    // Retry up to 3 times on unique constraint collision
    for (let attempt = 0; attempt < 3; attempt++) {
      const newCode = generateInviteCode();
      const { error } = await supabase
        .from("circle")
        .update({ invite_code: newCode })
        .eq("id", circleId);

      if (!error) {
        setCircle((prev) => (prev ? { ...prev, invite_code: newCode } : prev));
        break;
      }
    }
    setRegenerating(false);
  }

  async function handleRemoveMember(memberId: string, displayName: string) {
    if (!confirm(`Remove ${displayName} from this circle?`)) return;

    const { error } = await supabase
      .from("circle_member")
      .delete()
      .eq("circle_id", circleId)
      .eq("member_id", memberId);

    if (!error) {
      await fetchMembers();
    }
  }

  async function handleTransfer() {
    if (!transferTargetId || transferring) return;

    const target = members.find((m) => m.member_id === transferTargetId);
    if (!target) return;

    if (
      !confirm(
        `Transfer admin to ${target.member.display_name}? You will become a regular member.`
      )
    )
      return;

    setTransferring(true);
    const { error } = await supabase
      .from("circle")
      .update({ admin_id: transferTargetId })
      .eq("id", circleId);

    if (!error) {
      router.replace(`/circles/${circleId}`);
    }
    setTransferring(false);
  }

  async function handleDelete() {
    if (!circle || deleting) return;
    setDeleting(true);

    const { error } = await supabase
      .from("circle")
      .delete()
      .eq("id", circleId);

    if (!error) {
      router.replace("/circles");
    }
    setDeleting(false);
  }

  // --- Render ---

  if (loading || !authorized) {
    return (
      <div className="min-h-screen bg-brand-cream grain-light flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-brand-green/20 border-t-brand-green animate-spin" />
      </div>
    );
  }

  if (!circle) return null;

  const nonAdminMembers = members.filter(
    (m) => m.member_id !== circle.admin_id
  );

  return (
    <div className="min-h-screen bg-brand-cream grain-light">
      <div className="max-w-lg mx-auto px-5 py-6">
        {/* Back link */}
        <Link
          href={`/circles/${circleId}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-muted hover:text-brand-dark transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Back to Circle
        </Link>

        <h1 className="text-2xl font-bold text-brand-dark font-display mb-8">
          Circle Settings
        </h1>

        {/* ===== Section 1: Circle Name ===== */}
        <section className="border-b border-brand-dark/10 pb-6 mb-6">
          <h2 className="text-lg text-brand-dark font-display mb-3">
            Circle Name
          </h2>
          <form onSubmit={handleSaveName} className="flex gap-3">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              maxLength={50}
              className="w-full rounded-xl border border-brand-dark/10 bg-white px-4 py-3 text-sm text-brand-dark placeholder:text-brand-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
            <button
              type="submit"
              disabled={
                savingName || !editName.trim() || editName.trim() === circle.name
              }
              className="bg-brand-green text-white font-semibold rounded-xl px-4 py-2.5 text-sm hover:bg-brand-green-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              {savingName ? "Saving..." : "Save"}
            </button>
          </form>
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-xs text-brand-muted">
              {editName.length}/50 characters
            </p>
            {nameSaved && (
              <p className="text-xs text-brand-green font-medium animate-fadeIn">
                Saved!
              </p>
            )}
          </div>
        </section>

        {/* ===== Section 2: Invite Link ===== */}
        <section className="border-b border-brand-dark/10 pb-6 mb-6">
          <h2 className="text-lg text-brand-dark font-display mb-1">
            Invite Link
          </h2>
          <p className="text-sm text-brand-muted mb-3">
            Share this link to invite members to your Circle.
          </p>
          <div className="rounded-xl border border-brand-dark/10 bg-white/50 p-3 mb-3">
            <p className="text-xs text-brand-muted mb-1 font-medium">Invite code</p>
            <p className="font-mono text-lg tracking-widest text-brand-dark font-bold">
              {circle.invite_code}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopyLink}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-brand-dark/10 bg-white/50 px-4 py-2.5 text-sm font-semibold text-brand-dark hover:bg-white/80 transition-colors"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-brand-green" />
                  Link Copied!
                </>
              ) : (
                <>
                  <Copy size={14} />
                  Copy Invite Link
                </>
              )}
            </button>
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="flex items-center gap-1.5 rounded-xl border border-brand-dark/10 bg-white/50 px-4 py-2.5 text-sm font-medium text-brand-muted hover:bg-white/80 hover:text-brand-dark transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={regenerating ? "animate-spin" : ""} />
              {regenerating ? "..." : "New Code"}
            </button>
          </div>
        </section>

        {/* ===== Section 3: Members ===== */}
        <section className="border-b border-brand-dark/10 pb-6 mb-6">
          <h2 className="text-lg text-brand-dark font-display mb-3">
            Members
          </h2>
          <div className="space-y-2">
            {members.map((m) => {
              const isAdmin = m.member_id === circle.admin_id;
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-xl bg-white/30 backdrop-blur-sm border border-brand-dark/10 px-4 py-3"
                >
                  <span className="text-2xl">{m.member.avatar_emoji}</span>
                  <span className="flex-1 text-sm font-medium text-brand-dark">
                    {m.member.display_name}
                  </span>
                  {isAdmin ? (
                    <span className="text-xs font-semibold text-brand-green bg-brand-green/10 px-2.5 py-1 rounded-full">
                      Admin
                    </span>
                  ) : (
                    <button
                      onClick={() =>
                        handleRemoveMember(
                          m.member_id,
                          m.member.display_name
                        )
                      }
                      className="p-2 rounded-xl hover:bg-red-50 transition-colors"
                      title={`Remove ${m.member.display_name}`}
                    >
                      <X
                        size={16}
                        className="text-brand-muted/60 hover:text-red-500"
                      />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ===== Section 4: Transfer Admin ===== */}
        {nonAdminMembers.length > 0 && (
          <section className="border-b border-brand-dark/10 pb-6 mb-6">
            <h2 className="text-lg text-brand-dark font-display mb-3">
              Transfer Admin
            </h2>
            <p className="text-sm text-brand-muted mb-3">
              Hand over admin rights to another member. You will become a
              regular member.
            </p>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <select
                  value={transferTargetId}
                  onChange={(e) => setTransferTargetId(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-brand-dark/10 bg-white px-4 py-3 pr-10 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-green"
                >
                  <option value="">Select a member</option>
                  {nonAdminMembers.map((m) => (
                    <option key={m.member_id} value={m.member_id}>
                      {m.member.avatar_emoji} {m.member.display_name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted/60 pointer-events-none"
                />
              </div>
              <button
                onClick={handleTransfer}
                disabled={!transferTargetId || transferring}
                className="bg-brand-green text-white font-semibold rounded-xl px-4 py-2.5 text-sm hover:bg-brand-green-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                {transferring ? "Transferring..." : "Transfer"}
              </button>
            </div>
          </section>
        )}

        {/* ===== Section 5: Danger Zone ===== */}
        <section className="pb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-red-600" />
            <h2 className="text-lg text-red-600 font-display">Danger Zone</h2>
          </div>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors"
            >
              Delete Circle
            </button>
          ) : (
            <div className="rounded-xl border border-red-300 bg-red-50 p-4 space-y-3">
              <p className="text-sm text-red-600">
                This will permanently delete{" "}
                <strong>{circle.name}</strong> and all its data. Type the
                circle name to confirm.
              </p>
              <input
                type="text"
                value={deleteTyped}
                onChange={(e) => setDeleteTyped(e.target.value)}
                placeholder={circle.name}
                className="w-full rounded-xl border border-red-300 bg-white px-4 py-3 text-sm text-brand-dark placeholder:text-brand-muted/50 focus:outline-none focus:ring-2 focus:ring-red-400"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  disabled={deleteTyped !== circle.name || deleting}
                  className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? "Deleting..." : "Delete Forever"}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteTyped("");
                  }}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-brand-muted hover:bg-brand-dark/5 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
