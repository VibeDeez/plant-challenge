"use client";

import { useState, useRef, useEffect } from "react";
import { useApp } from "./ProtectedLayout";
import { ChevronDown } from "lucide-react";

export default function MemberSwitcher() {
  const { members, activeMember, setActiveMemberId } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (members.length <= 1) return null;

  return (
    <div ref={ref} className="sticky top-safe z-40 bg-brand-dark/95 backdrop-blur-sm border-b border-brand-cream/10">
      <div className="max-w-lg mx-auto px-5">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 w-full py-2.5 text-left"
        >
          <span className="text-lg">{activeMember?.avatar_emoji}</span>
          <span className="text-sm font-semibold text-brand-cream/90 flex-1 truncate">
            {activeMember?.display_name}
          </span>
          <ChevronDown
            size={14}
            className={`text-brand-cream/40 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="pb-2 space-y-0.5 animate-fadeIn">
            {members.map((m) => {
              const active = m.id === activeMember?.id;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setActiveMemberId(m.id);
                    setOpen(false);
                  }}
                  className={`flex items-center gap-2.5 w-full rounded-xl px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-brand-green/20 text-brand-green font-semibold"
                      : "text-brand-cream/60 hover:bg-brand-cream/10"
                  }`}
                >
                  <span className="text-base">{m.avatar_emoji}</span>
                  <span className="truncate">{m.display_name}</span>
                  {active && (
                    <span className="ml-auto text-[10px] font-bold text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
