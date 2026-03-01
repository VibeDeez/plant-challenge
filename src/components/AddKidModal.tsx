"use client";

import { useState } from "react";
import PlantPicker from "./PlantPicker";
import { getRandomAvatarKey } from "@/lib/constants";
import { X } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "@/components/ui/sheet";

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
  const [emoji, setEmoji] = useState(initial?.avatar_emoji ?? getRandomAvatarKey());

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ display_name: name.trim(), avatar_emoji: emoji });
  }

  return (
    <Sheet
      open
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <SheetContent>
        <div className="flex h-full min-h-[320px] flex-col p-5 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <div className="flex justify-center pt-0 pb-3">
            <div className="h-1 w-10 rounded-full bg-brand-dark/15" />
          </div>

          <div className="mb-5 flex items-center justify-between">
            <SheetTitle className="text-lg text-brand-dark font-display">
              {initial ? "Edit Member" : "Add Kid"}
            </SheetTitle>
            <SheetClose asChild>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-xl text-brand-dark/40 hover:text-brand-dark hover:bg-brand-dark/5 transition-colors"
                aria-label="Close add kid sheet"
              >
                <X size={20} />
              </button>
            </SheetClose>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto overscroll-contain">
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
                autoFocus
                className="w-full bg-white rounded-xl px-4 py-3 text-brand-dark border border-brand-dark/10 focus:ring-2 focus:ring-brand-green focus:border-transparent focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-muted mb-2">
                Avatar
              </label>
              <PlantPicker value={emoji} onChange={setEmoji} />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-brand-green px-4 py-3 text-sm font-semibold text-white hover:bg-brand-green-hover transition-colors"
            >
              {initial ? "Save Changes" : "Add Kid"}
            </button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
