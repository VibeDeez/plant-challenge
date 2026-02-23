"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, User, BookOpen } from "lucide-react";

const tabs = [
  { href: "/", label: "Home", icon: Home },
  { href: "/leaderboard", label: "Board", icon: Trophy },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/profile", label: "Profile", icon: User },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-50">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 text-xs transition-colors ${
                active ? "text-green-600" : "text-gray-400"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
              <span className={active ? "font-semibold" : ""}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
