type E2EGuardEnv = {
  nodeEnv?: string;
  e2eTest?: string;
};

export function isE2ERouteBlocked(env: E2EGuardEnv): boolean {
  if (env.nodeEnv === "production") return true;
  return env.e2eTest !== "true";
}
