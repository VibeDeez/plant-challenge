"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Leaf } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getWeekStart } from "@/lib/weekUtils";
import { useApp } from "@/components/ProtectedLayout";
import SageChat from "@/components/SageChat";
import SageMenuMax from "@/components/SageMenuMax";

type PlantLogRow = {
  plant_name: string;
  category: string;
  points: number;
};

const supabase = createClient();

export default function SagePage() {
  const { activeMember } = useApp();
  const searchParams = useSearchParams();
  const [weekLogs, setWeekLogs] = useState<PlantLogRow[]>([]);
  const weekStart = useMemo(() => getWeekStart(), []);

  useEffect(() => {
    async function fetchWeekContext() {
      if (!activeMember) return;

      const { data } = await supabase
        .from("plant_log")
        .select("plant_name, category, points")
        .eq("member_id", activeMember.id)
        .eq("week_start", weekStart);

      const logs = (data ?? []).filter(
        (row): row is PlantLogRow =>
          typeof row.plant_name === "string" &&
          typeof row.category === "string" &&
          typeof row.points === "number"
      );
      setWeekLogs(logs);
    }

    fetchWeekContext();
  }, [activeMember, weekStart]);

  const alreadyLoggedThisWeek = useMemo(
    () =>
      weekLogs
        .map((row) => row.plant_name.trim())
        .filter((name) => name.length > 0),
    [weekLogs]
  );

  const totalPoints = useMemo(
    () => Number(weekLogs.reduce((sum, row) => sum + row.points, 0).toFixed(2)),
    [weekLogs]
  );

  const uniquePlants = useMemo(
    () => new Set(alreadyLoggedThisWeek.map((name) => name.toLowerCase())).size,
    [alreadyLoggedThisWeek]
  );

  const requestedMode = searchParams.get("mode");
  const initialMenuMode =
    requestedMode === "image" || requestedMode === "discover" ? requestedMode : "url";

  return (
    <div className="min-h-screen bg-brand-bg" data-testid="sage-page">
      <section className="relative overflow-hidden bg-brand-dark px-page pt-6 pb-8 grain">
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
            <Leaf size={14} />
            Sage v2
          </p>
          <h1 className="font-display text-3xl text-brand-cream">Sage</h1>
          <p className="mt-2 max-w-sm text-sm text-brand-cream/70">
            Your plantmaxxing co-pilot for rule clarity and menu decisions.
          </p>
        </div>
      </section>

      <SageChat alreadyLoggedThisWeek={alreadyLoggedThisWeek} />

      <section className="bg-brand-bg px-page pb-28 grain-light">
        <div className="mx-auto max-w-lg stack-card">
          <SageMenuMax
            memberId={activeMember?.id ?? null}
            alreadyLoggedThisWeek={alreadyLoggedThisWeek}
            weekProgress={{
              points: totalPoints,
              uniquePlants,
              target: 30,
            }}
            initialMode={initialMenuMode}
          />

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
