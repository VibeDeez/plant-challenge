"use client";

import { useApp } from "./ProtectedLayout";

export default function MemberSwitcher() {
  const { members, activeMember, setActiveMemberId } = useApp();

  if (members.length <= 1) return null;

  return (
    <div className="flex gap-2 overflow-x-auto px-5 py-3 no-scrollbar">
      {members.map((m) => {
        const active = m.id === activeMember?.id;
        return (
          <button
            key={m.id}
            onClick={() => setActiveMemberId(m.id)}
            className={`flex items-center gap-2 shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
              active
                ? "bg-brand-green text-white shadow-sm"
                : "bg-brand-dark/5 text-brand-dark/60 hover:bg-brand-dark/10"
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
