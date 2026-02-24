export type Circle = {
  id: string;
  name: string;
  invite_code: string;
  admin_id: string;
  week_start_day: number;
  created_at: string;
};

export type CircleMember = {
  id: string;
  circle_id: string;
  member_id: string;
  joined_at: string;
};

export type CircleWeeklyScore = {
  circle_id: string;
  member_id: string;
  display_name: string;
  avatar_emoji: string;
  week_start: string;
  total_points: number;
  last_active_at: string | null;
  is_ghost: boolean;
};

export type CircleAlltimeScore = {
  circle_id: string;
  member_id: string;
  display_name: string;
  avatar_emoji: string;
  total_points: number;
  weeks_active: number;
  avg_weekly: number;
  last_active_at: string | null;
  is_ghost: boolean;
};

export type CircleActivity = {
  id: string;
  circle_id: string;
  member_id: string | null;
  event_type: "hit_30" | "new_lifetime_plant" | "streak_milestone" | "member_joined";
  payload: Record<string, unknown>;
  created_at: string;
  display_name?: string;
  avatar_emoji?: string;
};

export type CircleActivityReaction = {
  id: string;
  activity_id: string;
  member_id: string;
  emoji: ReactionEmoji;
  created_at: string;
};

export type ReactionEmoji = "fire" | "clap" | "flex" | "seedling" | "party" | "heart";

export const REACTION_EMOJIS: { key: ReactionEmoji; display: string }[] = [
  { key: "fire", display: "\uD83D\uDD25" },
  { key: "clap", display: "\uD83D\uDC4F" },
  { key: "flex", display: "\uD83D\uDCAA" },
  { key: "seedling", display: "\uD83C\uDF31" },
  { key: "party", display: "\uD83C\uDF89" },
  { key: "heart", display: "\u2764\uFE0F" },
];
