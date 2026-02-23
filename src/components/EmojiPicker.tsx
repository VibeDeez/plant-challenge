"use client";

import { MEMBER_EMOJIS } from "@/lib/constants";

export default function EmojiPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (emoji: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {MEMBER_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onChange(emoji)}
          className={`w-10 h-10 text-xl rounded-xl flex items-center justify-center transition-all ${
            value === emoji
              ? "bg-brand-green/15 ring-2 ring-brand-green scale-110"
              : "bg-brand-dark/5 hover:bg-brand-dark/10"
          }`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
