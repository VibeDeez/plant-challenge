"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import BottomNav from "./BottomNav";
import MemberSwitcher from "./MemberSwitcher";
import AddToHomeScreen from "./AddToHomeScreen";
import { getRandomAvatarKey } from "@/lib/constants";

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
const DEFAULT_MEMBER_RECOVERY_ERROR =
  "We could not restore your Plantmaxxing profile yet. Please retry or sign out and back in.";

type AuthUserLike = {
  email?: string | null;
  user_metadata?: {
    full_name?: unknown;
    name?: unknown;
  } | null;
};

function toDisplayName(value: string): string {
  const cleaned = value
    .trim()
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ");
  return cleaned.length > 0 ? cleaned : "Plant Fan";
}

function deriveOwnerDisplayName(user: AuthUserLike): string {
  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : "";
  if (fullName.trim()) {
    return toDisplayName(fullName);
  }

  const emailLocalPart = user.email?.split("@")[0] ?? "";
  if (emailLocalPart.trim()) {
    return toDisplayName(emailLocalPart);
  }

  return "Plant Fan";
}

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [memberRecoveryError, setMemberRecoveryError] = useState<string | null>(null);
  const router = useRouter();

  const applyMembers = useCallback((nextMembers: Member[]) => {
    setMembers(nextMembers);
    setActiveMemberId((prev) => {
      if (!prev || !nextMembers.find((member) => member.id === prev)) {
        return nextMembers[0]?.id ?? null;
      }
      return prev;
    });
  }, []);

  const fetchMembers = useCallback(
    async (uid: string, user?: AuthUserLike) => {
      const selectMembers = () =>
        supabase
          .from("member")
          .select("*")
          .eq("user_id", uid)
          .order("is_owner", { ascending: false })
          .order("created_at", { ascending: true });

      let { data, error } = await selectMembers();
      if (error) {
        setMemberRecoveryError(DEFAULT_MEMBER_RECOVERY_ERROR);
        applyMembers([]);
        return;
      }

      if ((data?.length ?? 0) === 0 && user) {
        const { error: insertError } = await supabase.from("member").insert({
          user_id: uid,
          display_name: deriveOwnerDisplayName(user),
          avatar_emoji: getRandomAvatarKey(),
          is_owner: true,
        });

        if (insertError && insertError.code !== "23505") {
          setMemberRecoveryError(DEFAULT_MEMBER_RECOVERY_ERROR);
          applyMembers([]);
          return;
        }

        const retry = await selectMembers();
        data = retry.data;
        error = retry.error;
      }

      if (error || (data?.length ?? 0) === 0) {
        setMemberRecoveryError(DEFAULT_MEMBER_RECOVERY_ERROR);
        applyMembers([]);
        return;
      }

      setMemberRecoveryError(null);
      applyMembers(data ?? []);
    },
    [applyMembers]
  );

  const refreshMembers = useCallback(async () => {
    if (!userId) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    await fetchMembers(userId, user ?? undefined);
  }, [fetchMembers, userId]);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  }, [router]);

  const handleRetry = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      await refreshMembers();
    } finally {
      setLoading(false);
    }
  }, [refreshMembers, userId]);

  const activeMember = members.find((m) => m.id === activeMemberId) ?? null;

  const contextValue = useMemo(
    () => ({
      userId: userId ?? "",
      members,
      activeMember,
      setActiveMemberId,
      refreshMembers,
    }),
    [userId, members, activeMember, refreshMembers]
  );

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        router.push("/auth");
        return;
      }
      setUserId(user.id);
      try {
        await fetchMembers(user.id, user);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [fetchMembers, router]);

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-brand-dark">
        <div className="w-8 h-8 border-2 border-brand-green/20 border-t-brand-green rounded-full animate-spin" />
      </main>
    );
  }

  if (!userId) return null;

  if (memberRecoveryError || !activeMember) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-brand-bg px-5">
        <div className="w-full max-w-sm rounded-2xl border border-brand-dark/10 bg-white/70 p-6 text-center shadow-sm">
          <h1 className="font-display text-2xl text-brand-dark">Profile Recovery</h1>
          <p className="mt-2 text-sm leading-relaxed text-brand-muted">
            {memberRecoveryError ?? DEFAULT_MEMBER_RECOVERY_ERROR}
          </p>
          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={handleRetry}
              className="w-full min-h-11 rounded-xl bg-brand-green px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-green-hover"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full min-h-11 rounded-xl border border-brand-dark/10 px-4 py-3 text-sm font-semibold text-brand-dark transition-colors hover:bg-brand-dark/5"
            >
              Sign Out
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <AppContext.Provider value={contextValue}>
      {/* PWA safe area cover — dark bar behind iOS status bar in standalone mode */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-brand-dark h-safe-top" />
      <div className="mt-safe">
        <MemberSwitcher />
        <div className="min-h-screen pb-24 bg-brand-bg">
          {children}
        </div>
      </div>
      <BottomNav />
      <AddToHomeScreen />
    </AppContext.Provider>
  );
}
