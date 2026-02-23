"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-brand-dark/10">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-4 text-left"
      >
        <span
          className="text-sm font-bold text-brand-dark font-display"
        >
          {title}
        </span>
        <ChevronDown
          size={18}
          className={`text-brand-muted transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="pb-4 text-sm text-brand-muted leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}
