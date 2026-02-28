export const ANALYTICS_EVENT_NAMES = [
  "log_success",
  "recognize_success",
  "recognize_failure",
  "recognize_corrected",
  "join_circle",
  "hit_30",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

export type AnalyticsEvent = {
  name: AnalyticsEventName;
  occurredAt: string;
  source: "client" | "server" | "db_trigger";
  actorId?: string;
  sessionId?: string;
  properties: Record<string, string | number | boolean | null>;
};

export function trackAnalyticsEvent(event: AnalyticsEvent): void {
  console.info("[analytics]", JSON.stringify(event));
}

export function buildAnalyticsEvent(
  name: AnalyticsEventName,
  source: AnalyticsEvent["source"],
  properties: AnalyticsEvent["properties"],
  actorId?: string
): AnalyticsEvent {
  return {
    name,
    source,
    occurredAt: new Date().toISOString(),
    actorId,
    properties,
  };
}
