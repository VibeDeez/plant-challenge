export const WEEKLY_GOAL_POINTS = 30;

export type LeaderboardGoalState = "completed" | "in-progress";

export function getLeaderboardGoalState(points: number): LeaderboardGoalState {
  return points >= WEEKLY_GOAL_POINTS ? "completed" : "in-progress";
}

export function getLeaderboardGoalMeta(points: number): {
  state: LeaderboardGoalState;
  showBadge: boolean;
  label: string;
  badgeClassName: string;
} {
  const state = getLeaderboardGoalState(points);
  if (state === "completed") {
    return {
      state,
      showBadge: true,
      label: "Goal hit",
      badgeClassName:
        "border-brand-green/35 bg-brand-green/15 text-brand-green",
    };
  }

  return {
    state,
    showBadge: false,
    label: "",
    badgeClassName: "",
  };
}
