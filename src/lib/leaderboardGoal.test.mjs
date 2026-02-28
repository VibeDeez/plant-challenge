import assert from "node:assert/strict";
import test from "node:test";
import {
  WEEKLY_GOAL_POINTS,
  getLeaderboardGoalMeta,
  getLeaderboardGoalState,
} from "./leaderboardGoal.ts";

test("points below 30 are in-progress", () => {
  assert.equal(WEEKLY_GOAL_POINTS, 30);
  assert.equal(getLeaderboardGoalState(29.99), "in-progress");

  const goal = getLeaderboardGoalMeta(12);
  assert.equal(goal.state, "in-progress");
  assert.equal(goal.showBadge, false);
  assert.equal(goal.label, "");
});

test("points at or above 30 are completed", () => {
  assert.equal(getLeaderboardGoalState(30), "completed");
  assert.equal(getLeaderboardGoalState(45), "completed");

  const goal = getLeaderboardGoalMeta(30);
  assert.equal(goal.state, "completed");
  assert.equal(goal.showBadge, true);
  assert.equal(goal.label, "Goal hit");
  assert.match(goal.badgeClassName, /text-brand-green/);
});
