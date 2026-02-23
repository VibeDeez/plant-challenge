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
    <div className="border-b border-gray-100">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-4 text-left"
      >
        <span className="text-sm font-semibold text-gray-900">{title}</span>
        <ChevronDown
          size={18}
          className={`text-gray-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="pb-4 text-sm text-gray-600 leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}
