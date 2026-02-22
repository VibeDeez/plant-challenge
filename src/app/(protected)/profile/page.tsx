"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useApp, type Member } from "@/components/ProtectedLayout";
import AddKidModal from "@/components/AddKidModal";
import EmojiPicker from "@/components/EmojiPicker";
import { LogOut, Pencil, Plus, Trash2 } from "lucide-react";

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
    <div className="px-4 pt-4">
      <h1 className="text-lg font-bold text-gray-900 mb-4">Profile</h1>

      {/* Owner profile */}
      {owner && !editingOwner && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{owner.avatar_emoji}</span>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">
                {owner.display_name}
              </p>
              <p className="text-xs text-gray-500">Account owner</p>
            </div>
            <button
              onClick={startEditOwner}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Pencil size={16} className="text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {editingOwner && (
        <form
          onSubmit={saveOwner}
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6 space-y-3"
        >
          <input
            type="text"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
          <EmojiPicker value={ownerEmoji} onChange={setOwnerEmoji} />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditingOwner(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Family */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">Family</h2>
          <button
            onClick={() => setKidModal({ open: true })}
            className="flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-700"
          >
            <Plus size={16} />
            Add Kid
          </button>
        </div>

        {kids.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">
            No kids added yet. Add family members to track their progress too.
          </p>
        ) : (
          <div className="space-y-2">
            {kids.map((kid) => (
              <div
                key={kid.id}
                className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3"
              >
                <span className="text-xl">{kid.avatar_emoji}</span>
                <p className="flex-1 text-sm font-medium text-gray-900">
                  {kid.display_name}
                </p>
                <button
                  onClick={() =>
                    setKidModal({ open: true, editing: kid })
                  }
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Pencil size={14} className="text-gray-400" />
                </button>
                <button
                  onClick={() => deleteKid(kid.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} className="text-gray-300 hover:text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="flex items-center gap-2 w-full justify-center rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
      >
        <LogOut size={16} />
        Sign Out
      </button>

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
