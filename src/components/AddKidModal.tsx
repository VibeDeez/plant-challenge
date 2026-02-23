"use client";

import { useState } from "react";
import EmojiPicker from "./EmojiPicker";
import { X } from "lucide-react";

type KidData = {
  id?: string;
  display_name: string;
  avatar_emoji: string;
};

export default function AddKidModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: KidData;
  onSave: (data: { display_name: string; avatar_emoji: string }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.display_name ?? "");
  const [emoji, setEmoji] = useState(initial?.avatar_emoji ?? "🌱");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ display_name: name.trim(), avatar_emoji: emoji });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full bg-[#f5f0e8] rounded-t-3xl p-5 pb-20">
        <div className="flex items-center justify-between mb-5">
          <h3
            className="text-lg text-[#1a3a2a]"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {initial ? "Edit Member" : "Add Kid"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-xl hover:bg-[#1a3a2a]/5 transition-colors"
          >
            <X size={20} className="text-[#1a3a2a]/40 hover:text-[#1a3a2a] transition-colors" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#6b7260] mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Kid's name"
              required
              className="w-full bg-white rounded-xl px-4 py-3 text-[#1a3a2a] border border-[#1a3a2a]/10 focus:ring-2 focus:ring-[#22c55e] focus:border-transparent focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#6b7260] mb-2">
              Avatar
            </label>
            <EmojiPicker value={emoji} onChange={setEmoji} />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-[#22c55e] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1ea34e] transition-colors"
          >
            {initial ? "Save Changes" : "Add Kid"}
          </button>
        </form>
      </div>
    </div>
  );
}
