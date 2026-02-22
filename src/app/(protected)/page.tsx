"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getWeekStart, getWeekLabel } from "@/lib/weekUtils";
import { useApp } from "@/components/ProtectedLayout";
import MemberSwitcher from "@/components/MemberSwitcher";
import ProgressRing from "@/components/ProgressRing";
import PlantCard from "@/components/PlantCard";
import Link from "next/link";
import { Plus } from "lucide-react";

type PlantLog = {
  id: string;
  plant_name: string;
  category: string;
  points: number;
  logged_at: string;
};

const supabase = createClient();

export default function HomePage() {
  const { activeMember } = useApp();
  const [logs, setLogs] = useState<PlantLog[]>([]);
  const [loading, setLoading] = useState(true);
  const weekStart = getWeekStart();

  const fetchLogs = useCallback(async () => {
    if (!activeMember) return;
    setLoading(true);
    const { data } = await supabase
      .from("plant_log")
      .select("id, plant_name, category, points, logged_at")
      .eq("member_id", activeMember.id)
      .eq("week_start", weekStart)
      .order("logged_at", { ascending: false });
    setLogs(data ?? []);
    setLoading(false);
  }, [activeMember, weekStart]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  async function handleDelete(id: string) {
    const { error } = await supabase.from("plant_log").delete().eq("id", id);
    if (!error) {
      setLogs((prev) => prev.filter((l) => l.id !== id));
    }
  }

  const totalPoints = logs.reduce((sum, l) => sum + l.points, 0);

  return (
    <>
      <MemberSwitcher />

      <div className="px-4 pt-2">
        <p className="text-xs text-gray-500 text-center mb-4">
          {getWeekLabel(weekStart)}
        </p>

        <div className="flex justify-center mb-6">
          <ProgressRing current={totalPoints} />
        </div>

        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">
            Logged Plants ({logs.length})
          </h2>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-8 text-sm">
            Loading...
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🌿</div>
            <p className="text-sm text-gray-500">
              No plants logged this week yet.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Tap + to start tracking
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <PlantCard key={log.id} log={log} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <Link
        href="/add"
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-lg hover:bg-green-700 active:scale-95 transition-all"
      >
        <Plus size={28} />
      </Link>
    </>
  );
}
