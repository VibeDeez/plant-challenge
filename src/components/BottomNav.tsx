"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, Target, User, BookOpen, BotMessageSquare } from "lucide-react";
import { farm } from "@lucide/lab";
import type { LucideIcon, IconNode } from "lucide-react";

type Tab = {
  href: string;
  label: string;
  icon?: LucideIcon;
  iconNode?: IconNode;
};

const tabs: Tab[] = [
  { href: "/", label: "Home", iconNode: farm },
  { href: "/circles", label: "Circles", icon: Target },
  { href: "/sage", label: "Sage", icon: BotMessageSquare },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/profile", label: "Profile", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-brand-dark pb-safe z-50">
      <div className="grid grid-cols-5 items-center h-20 px-2 max-w-lg mx-auto">
        {tabs.map(({ href, label, icon: IconComponent, iconNode }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          const classes = active
            ? "text-brand-green bg-brand-green/10"
            : "text-brand-cream/40 hover:text-brand-cream/70";

          return (
            <Link
              key={href}
              href={href}
              data-haptic="selection"
              className={`relative mx-auto flex min-h-11 min-w-11 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1.5 text-[11px] font-medium tracking-wide transition-all ${classes}`}
            >
              {iconNode ? (
                <Icon iconNode={iconNode} size={22} strokeWidth={active ? 2.25 : 1.5} />
              ) : (
                IconComponent && <IconComponent size={22} strokeWidth={active ? 2.25 : 1.5} />
              )}
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
