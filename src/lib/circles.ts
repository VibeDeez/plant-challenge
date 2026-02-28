const INVITE_CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

const JOIN_ERROR_MESSAGES = {
  invalid: "That invite code is invalid. Double-check the code and try again.",
  expired: "This invite code has expired. Ask for a fresh invite link.",
  reused: "That invite code has already been used. Ask for a new invite.",
  alreadyMember: "You are already in this circle.",
  generic: "Unable to join circle",
  malformed: "Unexpected response from server. Please try again.",
  missingCircleId:
    "Circle was joined, but we could not open it. Please refresh and try again.",
} as const;

type JoinCircleRpcPayload = {
  success?: boolean;
  circle_id?: unknown;
  message?: unknown;
  error?: unknown;
  code?: unknown;
  reason?: unknown;
};

export type JoinCircleValidationResult =
  | { ok: true; circleId: string }
  | { ok: false; message: string; circleId?: string };

export type CircleLeaderboardEntry = {
  member_id: string;
  total_points: number;
  is_ghost: boolean;
};

export type CircleActivityEntry = {
  id: string;
  circle_id: string;
  member_id: string | null;
  event_type: string;
};

export type CircleReactionEntry = {
  activity_id: string;
  member_id: string;
  emoji: string;
};

export type FeedSanitizationResult = {
  activities: CircleActivityEntry[];
  reactions: CircleReactionEntry[];
  discrepancies: string[];
};

export function generateInviteCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += INVITE_CHARSET[Math.floor(Math.random() * INVITE_CHARSET.length)];
  }
  return code;
}

export function getShareUrl(inviteCode: string): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL || "https://plant-challenge.onrender.com";
  return `${base}/join/${inviteCode}`;
}

export function isValidCircleId(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  const lowered = trimmed.toLowerCase();
  return lowered !== "undefined" && lowered !== "null";
}

export function isValidInviteCode(code: unknown): code is string {
  if (typeof code !== "string") return false;
  return /^[A-Z2-9]{6}$/.test(code.trim().toUpperCase());
}

function inferJoinErrorMessage(payload: JoinCircleRpcPayload): string {
  const rawMessage =
    typeof payload.message === "string" && payload.message.trim()
      ? payload.message
      : typeof payload.error === "string" && payload.error.trim()
      ? payload.error
      : "";
  const code =
    typeof payload.code === "string"
      ? payload.code.toLowerCase()
      : typeof payload.reason === "string"
      ? payload.reason.toLowerCase()
      : "";

  const haystack = `${code} ${rawMessage}`.toLowerCase();

  if (haystack.includes("already") && haystack.includes("member")) {
    return JOIN_ERROR_MESSAGES.alreadyMember;
  }
  if (haystack.includes("expired")) {
    return JOIN_ERROR_MESSAGES.expired;
  }
  if (
    haystack.includes("already_used") ||
    haystack.includes("already used") ||
    haystack.includes("reused")
  ) {
    return JOIN_ERROR_MESSAGES.reused;
  }
  if (
    haystack.includes("invalid") ||
    haystack.includes("not found") ||
    haystack.includes("unknown")
  ) {
    return JOIN_ERROR_MESSAGES.invalid;
  }

  return rawMessage || JOIN_ERROR_MESSAGES.generic;
}

export function validateJoinCirclePayload(
  payload: unknown
): JoinCircleValidationResult {
  if (!payload || typeof payload !== "object") {
    return { ok: false, message: JOIN_ERROR_MESSAGES.malformed };
  }

  const data = payload as JoinCircleRpcPayload;
  const safeCircleId = isValidCircleId(data.circle_id) ? data.circle_id : undefined;
  const message = inferJoinErrorMessage(data);

  if (data.success === true) {
    if (safeCircleId) {
      return { ok: true, circleId: safeCircleId };
    }
    return {
      ok: false,
      message: JOIN_ERROR_MESSAGES.missingCircleId,
    };
  }

  if (data.success === false) {
    return safeCircleId
      ? { ok: false, message, circleId: safeCircleId }
      : { ok: false, message };
  }

  if (safeCircleId && !data.error) {
    return { ok: true, circleId: safeCircleId };
  }

  return safeCircleId
    ? { ok: false, message, circleId: safeCircleId }
    : { ok: false, message };
}

function findDuplicateMemberIds(entries: CircleLeaderboardEntry[]): string[] {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const entry of entries) {
    if (seen.has(entry.member_id)) duplicates.push(entry.member_id);
    seen.add(entry.member_id);
  }
  return duplicates;
}

function isSortedLeaderboard(entries: CircleLeaderboardEntry[]): boolean {
  for (let i = 1; i < entries.length; i++) {
    const prev = entries[i - 1];
    const cur = entries[i];
    if (prev.is_ghost !== cur.is_ghost && prev.is_ghost) {
      return false;
    }
    if (prev.is_ghost === cur.is_ghost && prev.total_points < cur.total_points) {
      return false;
    }
  }
  return true;
}

export function detectLeaderboardDiscrepancies(params: {
  weeklyScores: CircleLeaderboardEntry[];
  alltimeScores: CircleLeaderboardEntry[];
  memberIds: string[];
}): string[] {
  const { weeklyScores, alltimeScores, memberIds } = params;
  const discrepancies: string[] = [];
  const memberSet = new Set(memberIds);

  const checkBoard = (label: "weekly" | "all-time", entries: CircleLeaderboardEntry[]) => {
    for (const dup of findDuplicateMemberIds(entries)) {
      discrepancies.push(`${label}: duplicate member_id ${dup}`);
    }
    for (const row of entries) {
      if (!memberSet.has(row.member_id)) {
        discrepancies.push(`${label}: score row references non-member ${row.member_id}`);
      }
      if (!Number.isFinite(row.total_points) || row.total_points < 0) {
        discrepancies.push(`${label}: invalid total_points for ${row.member_id}`);
      }
    }
    if (!isSortedLeaderboard(entries)) {
      discrepancies.push(`${label}: rows are not sorted by active/points rules`);
    }
  };

  checkBoard("weekly", weeklyScores);
  checkBoard("all-time", alltimeScores);

  return discrepancies;
}

export function validateMembershipOperation(params: {
  operation: "join" | "remove";
  circleId: unknown;
  memberId: unknown;
  existingMemberIds: string[];
}): { ok: boolean; message?: string } {
  const { operation, circleId, memberId, existingMemberIds } = params;
  if (!isValidCircleId(circleId)) {
    return { ok: false, message: "Invalid circle id" };
  }
  if (!isValidCircleId(memberId)) {
    return { ok: false, message: "Invalid member id" };
  }

  const hasMember = existingMemberIds.includes(memberId);
  if (operation === "join" && hasMember) {
    return { ok: false, message: "Member already belongs to this circle" };
  }
  if (operation === "remove" && !hasMember) {
    return { ok: false, message: "Cannot remove non-member from this circle" };
  }

  return { ok: true };
}

export function sanitizeActivityFeed(params: {
  activities: CircleActivityEntry[];
  reactions: CircleReactionEntry[];
  memberIds: string[];
}): FeedSanitizationResult {
  const discrepancies: string[] = [];
  const memberSet = new Set(params.memberIds);
  const reactionDedup = new Set<string>();
  const validReactions: CircleReactionEntry[] = [];

  const validActivities = params.activities.filter((activity) => {
    if (!activity.id || !activity.circle_id) {
      discrepancies.push("activity: dropped malformed row missing id/circle_id");
      return false;
    }
    if (activity.member_id && !memberSet.has(activity.member_id)) {
      discrepancies.push(
        `activity: row ${activity.id} references missing member ${activity.member_id}`
      );
      return false;
    }
    return true;
  });

  const validActivityIds = new Set(validActivities.map((a) => a.id));

  for (const reaction of params.reactions) {
    if (!validActivityIds.has(reaction.activity_id)) {
      discrepancies.push(
        `reaction: orphaned reaction for missing activity ${reaction.activity_id}`
      );
      continue;
    }
    if (!memberSet.has(reaction.member_id)) {
      discrepancies.push(
        `reaction: reaction references missing member ${reaction.member_id}`
      );
      continue;
    }
    const dedupKey = `${reaction.activity_id}:${reaction.member_id}:${reaction.emoji}`;
    if (reactionDedup.has(dedupKey)) {
      discrepancies.push(`reaction: duplicate reaction ${dedupKey}`);
      continue;
    }
    reactionDedup.add(dedupKey);
    validReactions.push(reaction);
  }

  return {
    activities: validActivities,
    reactions: validReactions,
    discrepancies,
  };
}

export function formatActivityEvent(
  eventType: string,
  displayName: string,
  payload: Record<string, unknown>
): string {
  switch (eventType) {
    case "hit_30":
      return `${displayName} hit 30 this week!`;
    case "new_lifetime_plant":
      return `${displayName} tried ${payload.plant_name} for the first time`;
    case "streak_milestone":
      return `${displayName} is on a ${payload.streak_count}-week streak!`;
    case "member_joined":
      return `${displayName} joined the circle`;
    default:
      return `${displayName} did something`;
  }
}

export function getActivityIcon(eventType: string): string {
  switch (eventType) {
    case "hit_30":
      return "\uD83C\uDFAF";
    case "new_lifetime_plant":
      return "\uD83C\uDF31";
    case "streak_milestone":
      return "\uD83D\uDD25";
    case "member_joined":
      return "\uD83D\uDC4B";
    default:
      return "\uD83D\uDCCC";
  }
}

export function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
