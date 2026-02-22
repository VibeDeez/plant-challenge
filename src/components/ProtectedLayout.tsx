"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import BottomNav from "./BottomNav";

type Member = {
  id: string;
  user_id: string;
  display_name: string;
  avatar_emoji: string;
  is_owner: boolean;
};

type AppContextType = {
  userId: string;
  members: Member[];
  activeMember: Member | null;
  setActiveMemberId: (id: string) => void;
  refreshMembers: () => Promise<void>;
};

const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside ProtectedLayout");
  return ctx;
}

export type { Member };

const supabase = createClient();

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchMembers = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from("member")
      .select("*")
      .eq("user_id", uid)
      .order("is_owner", { ascending: false })
      .order("created_at", { ascending: true });
    if (data) {
      setMembers(data);
      setActiveMemberId((prev) => {
        if (!prev || !data.find((m) => m.id === prev)) {
          return data[0]?.id ?? null;
        }
        return prev;
      });
    }
  }, []);

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
        return;
      }
      setUserId(user.id);
      await fetchMembers(user.id);
      setLoading(false);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <div className="text-4xl animate-pulse">🌱</div>
      </main>
    );
  }

  if (!userId) return null;

  const activeMember = members.find((m) => m.id === activeMemberId) ?? null;

  return (
    <AppContext.Provider
      value={{
        userId,
        members,
        activeMember,
        setActiveMemberId,
        refreshMembers: () => fetchMembers(userId),
      }}
    >
      <div className="min-h-screen pb-20">
        {children}
      </div>
      <BottomNav />
    </AppContext.Provider>
  );
}
