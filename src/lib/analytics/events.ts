export const ANALYTICS_EVENT_NAMES = [
  "log_success",
  "recognize_success",
  "recognize_failure",
  "recognize_corrected",
  "voice_log_opened",
  "voice_log_recording_started",
  "voice_log_recording_stopped",
  "voice_log_transcription_succeeded",
  "voice_log_transcription_failed",
  "voice_log_parse_succeeded",
  "voice_log_parse_failed",
  "voice_log_review_shown",
  "voice_log_item_unchecked",
  "voice_log_item_checked",
  "voice_log_item_added_manual",
  "voice_log_confirmed",
  "voice_log_draft_resumed",
  "voice_log_abandoned",
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
