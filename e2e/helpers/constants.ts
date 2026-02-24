export const TEST_USER_NAME = "Me";

export function uniqueName(prefix: string): string {
  return `${prefix} ${Date.now().toString(36)}`;
}
