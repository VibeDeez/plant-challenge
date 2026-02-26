"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MessageCircle, Sparkles, NotebookPen, Camera, Link2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getWeekStart } from "@/lib/weekUtils";
import { useApp } from "@/components/ProtectedLayout";
import SageChat from "@/components/SageChat";

const supabase = createClient();

export default function SagePage() {
  const { activeMember } = useApp();
  const [loggedPlantsThisWeek, setLoggedPlantsThisWeek] = useState<string[]>([]);
  const weekStart = useMemo(() => getWeekStart(), []);

  useEffect(() => {
    async function fetchWeekContext() {
      if (!activeMember) return;

      const { data } = await supabase
        .from("plant_log")
        .select("plant_name")
        .eq("member_id", activeMember.id)
        .eq("week_start", weekStart);

      setLoggedPlantsThisWeek(
        (data ?? [])
          .map((row) => row.plant_name?.trim())
          .filter((name): name is string => Boolean(name))
      );
    }

    fetchWeekContext();
  }, [activeMember, weekStart]);

  return (
    <div className="min-h-screen bg-brand-bg" data-testid="sage-page">
      <section className="relative overflow-hidden bg-brand-dark px-5 pt-6 pb-8 grain">
        <div className="absolute -right-6 -bottom-8 pointer-events-none">
          <Image
            src="/illustrations/library/sage.png"
            alt=""
            width={180}
            height={180}
            className="object-contain illo-accent"
            unoptimized
          />
        </div>
        <div className="relative mx-auto max-w-lg">
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand-cream/60">
            <Sparkles size={14} />
            Sage v2
          </p>
          <h1 className="font-display text-3xl text-brand-cream">Sage</h1>
          <p className="mt-2 max-w-sm text-sm text-brand-cream/70">
            Your plantmaxxing co-pilot for questions, quick chat logging, and menu planning.
          </p>
        </div>
      </section>

      <section className="bg-brand-cream px-5 py-5 grain-light">
        <div className="mx-auto max-w-lg space-y-3">
          <article className="rounded-2xl border border-brand-dark/10 bg-white/70 p-4">
            <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-muted">
              <MessageCircle size={14} />
              Ask Sage
            </p>
            <h2 className="text-lg font-display text-brand-dark">Rule Q&A</h2>
            <p className="mt-1 text-sm text-brand-muted">
              Ask count-rule or scoring questions with your current week context.
            </p>
          </article>
        </div>
      </section>

      <SageChat alreadyLoggedThisWeek={loggedPlantsThisWeek} />

      <section className="bg-brand-cream px-5 pb-28 grain-light">
        <div className="mx-auto max-w-lg space-y-3">
          <article className="rounded-2xl border border-brand-dark/10 bg-white/70 p-4">
            <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-muted">
              <NotebookPen size={14} />
              Quick Log
            </p>
            <h2 className="text-lg font-display text-brand-dark">Log via chat intent</h2>
            <p className="mt-1 text-sm text-brand-muted">
              Coming soon: Sage will suggest one-tap saves from chat responses.
            </p>
            <button
              type="button"
              disabled
              className="mt-3 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-green/40 px-4 py-2 text-sm font-semibold text-white opacity-80"
            >
              Quick Log Placeholder
            </button>
          </article>

          <article className="rounded-2xl border border-brand-dark/10 bg-white/70 p-4">
            <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-muted">
              <Camera size={14} />
              Menu Max
            </p>
            <h2 className="text-lg font-display text-brand-dark">Restaurant helper</h2>
            <p className="mt-1 text-sm text-brand-muted">
              Coming soon: paste a menu URL or upload a photo to find max-point options.
            </p>
            <div className="mt-3 space-y-2">
              <div className="flex min-h-11 items-center gap-2 rounded-xl border border-brand-dark/10 bg-brand-bg px-3 text-sm text-brand-muted">
                <Link2 size={15} />
                URL input placeholder
              </div>
              <div className="flex min-h-11 items-center gap-2 rounded-xl border border-dashed border-brand-dark/20 bg-brand-bg px-3 text-sm text-brand-muted">
                <Camera size={15} />
                Photo upload placeholder
              </div>
            </div>
          </article>

          <Link
            href="/add"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-brand-dark/15 bg-white px-4 py-2 text-sm font-semibold text-brand-dark transition-colors hover:bg-brand-dark/5"
          >
            Keep logging manually in Add
          </Link>
        </div>
      </section>
    </div>
  );
}
