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
          className={`w-10 h-10 text-xl rounded-lg flex items-center justify-center transition-all ${
            value === emoji
              ? "bg-green-100 ring-2 ring-green-500 scale-110"
              : "bg-gray-50 hover:bg-gray-100"
          }`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
