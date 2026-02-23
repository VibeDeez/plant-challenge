/** Get the Sunday (week start) for a given date, using local timezone.
 *  Weeks run Sunday → Saturday. */
export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon, …, 6=Sat
  d.setDate(d.getDate() - day); // go back to Sunday
  // Use local date parts to avoid UTC timezone mismatch
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/** Get a human-readable label for the week: "Feb 17 – Feb 23" */
export function getWeekLabel(weekStart: string): string {
  const start = new Date(weekStart + "T00:00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return `${fmt(start)} – ${fmt(end)}`;
}

/** Return day-of-week info for the week progress indicator.
 *  Each entry: { label: "S"|"M"|…, passed: boolean, isToday: boolean } */
export function getWeekDays(weekStart: string): { label: string; passed: boolean; isToday: boolean }[] {
  const LABELS = ["S", "M", "T", "W", "T", "F", "S"];
  const start = new Date(weekStart + "T00:00:00");
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  return LABELS.map((label, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return {
      label,
      passed: dStr < todayStr,
      isToday: dStr === todayStr,
    };
  });
}
