"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/components/ProtectedLayout";
import { createClient } from "@/lib/supabase/client";
import { validateJoinCirclePayload } from "@/lib/circles";
import Link from "next/link";

const supabase = createClient();

export default function JoinCirclePage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { activeMember } = useApp();
  const [error, setError] = useState<string | null>(null);
  const [circleId, setCircleId] = useState<string | null>(null);

  useEffect(() => {
    const memberId = activeMember?.id;
    if (!memberId || !code) return;

    let cancelled = false;

    async function joinCircle() {
      const result = await supabase.rpc("join_circle", {
        p_invite_code: code,
        p_member_id: memberId,
      });

      if (cancelled) return;

      if (result.error) {
        setError(result.error.message);
        return;
      }

      const validated = validateJoinCirclePayload(result.data);

      if (validated.ok) {
        router.push(`/circles/${validated.circleId}`);
        return;
      }

      setError(validated.message);
      if (validated.circleId) {
        setCircleId(validated.circleId);
      }
    }

    joinCircle();

    return () => {
      cancelled = true;
    };
  }, [activeMember, code, router]);

  if (error) {
    const isAlreadyMember = error.toLowerCase().includes("already a member");

    return (
      <main className="flex items-center justify-center min-h-screen bg-brand-cream">
        <div className="max-w-sm w-full mx-4">
          <div className="bg-white/30 backdrop-blur-sm rounded-2xl border border-brand-dark/10 p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <span className="text-red-600 text-xl font-bold">!</span>
            </div>

            <h1 className="text-xl font-bold text-brand-dark mb-2 font-display">
              {isAlreadyMember ? "Already a Member" : "Could Not Join"}
            </h1>

            <p className="text-sm text-brand-muted mb-6">{error}</p>

            {isAlreadyMember && circleId ? (
              <Link
                href={`/circles/${circleId}`}
                className="inline-block px-6 py-2.5 bg-brand-green text-white text-sm font-semibold rounded-xl hover:bg-brand-green-hover transition-colors"
              >
                Go to Circle
              </Link>
            ) : (
              <Link
                href="/circles"
                className="inline-block px-6 py-2.5 bg-brand-green text-white text-sm font-semibold rounded-xl hover:bg-brand-green-hover transition-colors"
              >
                Back to Circles
              </Link>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex items-center justify-center min-h-screen bg-brand-cream">
      <div className="text-center">
        <div className="h-8 w-8 border-2 border-brand-green/20 border-t-brand-green rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-brand-muted">Joining circle...</p>
      </div>
    </main>
  );
}
