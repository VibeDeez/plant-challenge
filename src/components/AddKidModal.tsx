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
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-2xl p-4 pb-safe">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">
            {initial ? "Edit Member" : "Add Kid"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Kid's name"
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Avatar
            </label>
            <EmojiPicker value={emoji} onChange={setEmoji} />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
          >
            {initial ? "Save Changes" : "Add Kid"}
          </button>
        </form>
      </div>
    </div>
  );
}
