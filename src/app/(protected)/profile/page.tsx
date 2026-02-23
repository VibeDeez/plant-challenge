"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useApp, type Member } from "@/components/ProtectedLayout";
import AddKidModal from "@/components/AddKidModal";
import EmojiPicker from "@/components/EmojiPicker";
import { LogOut, Pencil, Plus, Trash2 } from "lucide-react";
import Image from "next/image";

const supabase = createClient();

const ILLUSTRATIONS = [
  "/illustrations/strawberry.png",
  "/illustrations/vegetables.png",
  "/illustrations/grains.png",
  "/illustrations/legumes.png",
  "/illustrations/nuts.png",
  "/illustrations/seeds.png",
  "/illustrations/herbs.png",
  "/illustrations/spices.png",
];

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
    <div className="min-h-screen bg-[#f8faf8]">
      {/* Dark green header with botanical watermark */}
      <div className="relative bg-[#1a3a2a] px-5 pt-6 pb-8 overflow-hidden grain">
        <div className="absolute -right-6 -bottom-6 w-44 h-44 opacity-[0.10] pointer-events-none">
          <Image
            src="/illustrations/herbs.png"
            alt=""
            width={180}
            height={180}
            className="object-contain"
          />
        </div>
        <h1
          className="relative text-2xl text-[#f5f0e8]"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Profile
        </h1>
      </div>

      <div className="px-4 -mt-4 pb-8 space-y-6">
        {/* Owner card */}
        {owner && !editingOwner && (
          <div className="relative rounded-2xl overflow-hidden shadow-sm">
            {/* Botanical background */}
            <div className="absolute -right-4 -top-2 w-36 h-36 opacity-[0.15] pointer-events-none">
              <Image
                src="/illustrations/vegetables.png"
                alt=""
                width={150}
                height={150}
                className="object-contain"
              />
            </div>
            {/* Glassmorphic overlay */}
            <div className="relative bg-white/30 backdrop-blur-sm border border-[#1a3a2a]/10 rounded-2xl p-5">
              <div className="flex items-center gap-4">
                <span className="text-5xl">{owner.avatar_emoji}</span>
                <div className="flex-1">
                  <p
                    className="text-xl text-[#1a3a2a]"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    {owner.display_name}
                  </p>
                  <p className="text-sm text-[#6b7260] mt-0.5">
                    Account owner
                  </p>
                </div>
                <button
                  onClick={startEditOwner}
                  className="p-2.5 rounded-xl bg-[#1a3a2a]/5 hover:bg-[#1a3a2a]/10 transition-colors"
                >
                  <Pencil size={16} className="text-[#1a3a2a]/60" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Owner editing form */}
        {editingOwner && (
          <form
            onSubmit={saveOwner}
            className="bg-[#f5f0e8] rounded-2xl border border-[#1a3a2a]/10 shadow-sm p-5 space-y-4"
          >
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full bg-white rounded-xl border border-[#1a3a2a]/20 px-4 py-3 text-[#1a3a2a] focus:ring-2 focus:ring-[#22c55e] focus:border-transparent focus:outline-none transition-all"
            />
            <EmojiPicker value={ownerEmoji} onChange={setOwnerEmoji} />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-[#22c55e] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1ea34e] transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingOwner(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium text-[#6b7260] hover:bg-[#1a3a2a]/5 transition-colors"
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
              className="text-lg text-[#1a3a2a]"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Family
            </h2>
            <button
              onClick={() => setKidModal({ open: true })}
              className="flex items-center gap-1.5 text-sm font-medium text-[#22c55e] hover:text-[#1ea34e] transition-colors"
            >
              <Plus size={16} />
              Add Kid
            </button>
          </div>

          {kids.length === 0 ? (
            <div className="relative rounded-2xl overflow-hidden">
              <div className="absolute right-4 top-2 w-36 h-36 opacity-[0.2] pointer-events-none">
                <Image
                  src="/illustrations/seeds.png"
                  alt=""
                  width={150}
                  height={150}
                  className="object-contain"
                />
              </div>
              <div className="relative bg-white/30 backdrop-blur-sm border border-[#1a3a2a]/10 rounded-2xl py-10 px-6 text-center">
                <p
                  className="text-[#6b7260] text-base"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  No kids added yet
                </p>
                <p className="text-[#6b7260]/60 text-sm mt-1">
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
                  <div className="absolute -right-4 -top-2 w-32 h-32 opacity-[0.2] pointer-events-none">
                    <Image
                      src={ILLUSTRATIONS[index % 8]}
                      alt=""
                      width={130}
                      height={130}
                      className="object-contain"
                    />
                  </div>
                  {/* Glassmorphic card */}
                  <div className="relative bg-white/30 backdrop-blur-sm border border-[#1a3a2a]/10 rounded-2xl px-4 py-3.5 flex items-center gap-3">
                    <span className="text-2xl">{kid.avatar_emoji}</span>
                    <p
                      className="flex-1 text-[#1a3a2a] font-medium"
                      style={{ fontFamily: "Georgia, serif" }}
                    >
                      {kid.display_name}
                    </p>
                    <button
                      onClick={() =>
                        setKidModal({ open: true, editing: kid })
                      }
                      className="p-2 rounded-xl hover:bg-[#1a3a2a]/5 transition-colors"
                    >
                      <Pencil size={14} className="text-[#6b7260]" />
                    </button>
                    <button
                      onClick={() => deleteKid(kid.id)}
                      className="p-2 rounded-xl hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} className="text-[#6b7260]/50 hover:text-red-500" />
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
          className="flex items-center gap-2 w-full justify-center rounded-xl border border-[#1a3a2a]/10 px-4 py-3.5 text-sm font-medium text-[#6b7260] hover:bg-[#1a3a2a]/5 transition-colors"
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
