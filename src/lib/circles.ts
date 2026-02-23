const INVITE_CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

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
