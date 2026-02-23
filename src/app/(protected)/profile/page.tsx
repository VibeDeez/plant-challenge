"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useApp, type Member } from "@/components/ProtectedLayout";
import AddKidModal from "@/components/AddKidModal";
import EmojiPicker from "@/components/EmojiPicker";
import { LogOut, Pencil, Plus, Trash2 } from "lucide-react";
import { ALL_ILLUSTRATIONS } from "@/lib/constants";
import Image from "next/image";

const supabase = createClient();

export default function ProfilePage() {
  const { userId, members, refreshMembers } = useApp();
  const [editingOwner, setEditingOwner] = useState(false);
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmoji, setOwnerEmoji] = useState("");
  const [kidModal, setKidModal] = useState<{
    open: boolean;
    editing?: Member;
  }>({ open: false });
  const router = useRouter();

  const owner = members.find((m) => m.is_owner);
  const kids = members.filter((m) => !m.is_owner);

  function startEditOwner() {
    if (!owner) return;
    setOwnerName(owner.display_name);
    setOwnerEmoji(owner.avatar_emoji);
    setEditingOwner(true);
  }

  async function saveOwner(e: React.FormEvent) {
    e.preventDefault();
    if (!owner || !ownerName.trim()) return;
    const { error } = await supabase
      .from("member")
      .update({ display_name: ownerName.trim(), avatar_emoji: ownerEmoji })
      .eq("id", owner.id);
    if (!error) {
      setEditingOwner(false);
      await refreshMembers();
    }
  }

  async function saveKid(data: { display_name: string; avatar_emoji: string }) {
    if (kidModal.editing) {
      const { error } = await supabase
        .from("member")
        .update(data)
        .eq("id", kidModal.editing.id);
      if (error) return;
    } else {
      const { error } = await supabase.from("member").insert({
        user_id: userId,
        is_owner: false,
        ...data,
      });
      if (error) return;
    }
    setKidModal({ open: false });
    await refreshMembers();
  }

  async function deleteKid(id: string) {
    if (!confirm("Remove this member? Their plant logs will also be deleted."))
      return;
    const { error } = await supabase.from("member").delete().eq("id", id);
    if (!error) {
      await refreshMembers();
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Dark green header with botanical watermark */}
      <div className="relative bg-brand-dark px-5 pt-6 pb-8 overflow-hidden grain">
        <div className="absolute -right-6 -bottom-6 w-44 h-44 illo-accent pointer-events-none">
          <Image
            src="/illustrations/herbs.png"
            alt=""
            width={180}
            height={180}
            className="object-contain"
          />
        </div>
        <h1
          className="relative text-2xl text-brand-cream font-display"
        >
          Profile
        </h1>
      </div>

      <div className="px-4 -mt-4 pb-8 space-y-6">
        {/* Owner card */}
        {owner && !editingOwner && (
          <div className="relative rounded-2xl overflow-hidden shadow-sm">
            {/* Botanical background */}
            <div className="absolute -right-4 -top-2 w-36 h-36 illo-accent pointer-events-none">
              <Image
                src="/illustrations/vegetables.png"
                alt=""
                width={150}
                height={150}
                className="object-contain"
              />
            </div>
            {/* Glassmorphic overlay */}
            <div className="relative bg-white/30 backdrop-blur-sm border border-brand-dark/10 rounded-2xl p-5">
              <div className="flex items-center gap-4">
                <span className="text-5xl">{owner.avatar_emoji}</span>
                <div className="flex-1">
                  <p
                    className="text-xl text-brand-dark font-display"
                  >
                    {owner.display_name}
                  </p>
                  <p className="text-sm text-brand-rose mt-0.5">
                    Account owner
                  </p>
                </div>
                <button
                  onClick={startEditOwner}
                  className="p-2.5 rounded-xl bg-brand-dark/5 hover:bg-brand-dark/10 transition-colors"
                >
                  <Pencil size={16} className="text-brand-dark/60" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Owner editing form */}
        {editingOwner && (
          <form
            onSubmit={saveOwner}
            className="bg-brand-cream rounded-2xl border border-brand-dark/10 shadow-sm p-5 space-y-4"
          >
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full bg-white rounded-xl border border-brand-dark/20 px-4 py-3 text-brand-dark focus:ring-2 focus:ring-brand-green focus:border-transparent focus:outline-none transition-all"
            />
            <EmojiPicker value={ownerEmoji} onChange={setOwnerEmoji} />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-brand-green px-4 py-3 text-sm font-semibold text-white hover:bg-brand-green-hover transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingOwner(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium text-brand-muted hover:bg-brand-dark/5 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Family section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2
              className="text-lg text-brand-dark font-display"
            >
              Family
            </h2>
            <button
              onClick={() => setKidModal({ open: true })}
              className="flex items-center gap-1.5 text-sm font-medium text-brand-green hover:text-brand-green-hover transition-colors"
            >
              <Plus size={16} />
              Add Kid
            </button>
          </div>

          {kids.length === 0 ? (
            <div className="relative rounded-2xl overflow-hidden">
              <div className="absolute right-4 top-2 w-36 h-36 illo-accent pointer-events-none">
                <Image
                  src="/illustrations/seeds.png"
                  alt=""
                  width={150}
                  height={150}
                  className="object-contain"
                />
              </div>
              <div className="relative bg-white/30 backdrop-blur-sm border border-brand-dark/10 rounded-2xl py-10 px-6 text-center">
                <p
                  className="text-brand-muted text-base font-display"
                >
                  No kids added yet
                </p>
                <p className="text-brand-muted/60 text-sm mt-1">
                  Add family members to track their progress too.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {kids.map((kid, index) => (
                <div
                  key={kid.id}
                  className="relative rounded-2xl overflow-hidden"
                >
                  {/* Rotating botanical background */}
                  <div className="absolute -right-4 -top-2 w-32 h-32 illo-accent pointer-events-none">
                    <Image
                      src={ALL_ILLUSTRATIONS[index % ALL_ILLUSTRATIONS.length]}
                      alt=""
                      width={130}
                      height={130}
                      className="object-contain"
                    />
                  </div>
                  {/* Glassmorphic card */}
                  <div className="relative bg-white/30 backdrop-blur-sm border border-brand-dark/10 rounded-2xl px-4 py-3.5 flex items-center gap-3">
                    <span className="text-2xl">{kid.avatar_emoji}</span>
                    <p
                      className="flex-1 text-brand-dark font-medium font-display"
                    >
                      {kid.display_name}
                    </p>
                    <button
                      onClick={() =>
                        setKidModal({ open: true, editing: kid })
                      }
                      className="p-2 rounded-xl hover:bg-brand-dark/5 transition-colors"
                    >
                      <Pencil size={14} className="text-brand-muted" />
                    </button>
                    <button
                      onClick={() => deleteKid(kid.id)}
                      className="p-2 rounded-xl hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} className="text-brand-muted/60 hover:text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full justify-center rounded-xl border border-brand-dark/10 px-4 py-3.5 text-sm font-medium text-brand-muted hover:bg-brand-dark/5 transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>

      {kidModal.open && (
        <AddKidModal
          initial={kidModal.editing}
          onSave={saveKid}
          onClose={() => setKidModal({ open: false })}
        />
      )}
    </div>
  );
}
