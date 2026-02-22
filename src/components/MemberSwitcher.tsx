"use client";

import { useApp } from "./ProtectedLayout";

export default function MemberSwitcher() {
  const { members, activeMember, setActiveMemberId } = useApp();

  if (members.length <= 1) return null;

  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-2 no-scrollbar">
      {members.map((m) => {
        const active = m.id === activeMember?.id;
        return (
          <button
            key={m.id}
            onClick={() => setActiveMemberId(m.id)}
            className={`flex items-center gap-1.5 shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
              active
                ? "bg-green-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span>{m.avatar_emoji}</span>
            <span>{m.display_name}</span>
          </button>
        );
      })}
    </div>
  );
}
