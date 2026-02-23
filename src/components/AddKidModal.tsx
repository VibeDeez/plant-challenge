"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ display_name: name.trim(), avatar_emoji: emoji });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 animate-fadeIn" onClick={onClose} />
      <div className="relative w-full bg-brand-cream rounded-t-3xl p-5 pb-20 animate-slideUp">
        <div className="flex justify-center pt-0 pb-3"><div className="w-10 h-1 rounded-full bg-brand-dark/15" /></div>
        <div className="flex items-center justify-between mb-5">
          <h3
            className="text-lg text-brand-dark font-display"
          >
            {initial ? "Edit Member" : "Add Kid"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-xl hover:bg-brand-dark/5 transition-colors"
          >
            <X size={20} className="text-brand-dark/40 hover:text-brand-dark transition-colors" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-muted mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Kid's name"
              required
              className="w-full bg-white rounded-xl px-4 py-3 text-brand-dark border border-brand-dark/10 focus:ring-2 focus:ring-brand-green focus:border-transparent focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-muted mb-2">
              Avatar
            </label>
            <EmojiPicker value={emoji} onChange={setEmoji} />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-brand-green px-4 py-3 text-sm font-semibold text-white hover:bg-brand-green-hover transition-colors"
          >
            {initial ? "Save Changes" : "Add Kid"}
          </button>
        </form>
      </div>
    </div>
  );
}
