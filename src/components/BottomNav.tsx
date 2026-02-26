"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, User, BookOpen, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Tab = {
  href: string;
  label: string;
  icon: LucideIcon;
  accent?: boolean;
};

const tabs: Tab[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/circles", label: "Circles", icon: Trophy },
  { href: "/sage", label: "Sage", icon: Sparkles, accent: true },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/profile", label: "Profile", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-brand-dark pb-safe z-50">
      <div className="grid grid-cols-5 items-center h-20 px-2 max-w-lg mx-auto">
        {tabs.map(({ href, label, icon: Icon, accent }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          const classes = accent
            ? active
              ? "text-white bg-brand-green shadow-[0_8px_20px_rgba(34,197,94,0.35)]"
              : "text-brand-cream bg-brand-green/70"
            : active
              ? "text-brand-green bg-brand-green/10"
              : "text-brand-cream/40 hover:text-brand-cream/70";

          return (
            <Link
              key={href}
              href={href}
              className={`relative mx-auto flex min-h-11 min-w-11 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1.5 text-[11px] font-medium tracking-wide transition-all ${classes} ${accent ? "min-h-14 min-w-14 -mt-4 rounded-full" : ""}`}
            >
              <Icon size={accent ? 20 : 22} strokeWidth={active || accent ? 2.25 : 1.5} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
