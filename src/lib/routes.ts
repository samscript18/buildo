export function isWorkspaceRoute(path: string) {
  return [
    "/dashboard",
    "/assets",
    "/settings",
    "/projects",
    "/studio",
    "/admin",
  ].some((root) => path === root || path.startsWith(root + "/"));
}
export function isCommunityRoute(path: string) {
  return ["/explore", "/challenges", "/designs", "/creators"].some(
    (root) => path === root || path.startsWith(root + "/"),
  );
}
