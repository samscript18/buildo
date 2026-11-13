import { it, expect } from "vitest";
import { isWorkspaceRoute, isCommunityRoute } from "../src/lib/routes";
it("uses the workspace shell for each private route and nested studio/admin screens", () => {
  for (const route of [
    "/dashboard",
    "/assets",
    "/settings",
    "/projects/new",
    "/studio/abc",
    "/admin/challenges",
  ])
    expect(isWorkspaceRoute(route)).toBe(true);
});
it("preserves public navigation and avoids matching unrelated route prefixes", () => {
  for (const route of [
    "/",
    "/explore",
    "/challenges",
    "/challenges/abc",
    "/designs/abc",
    "/creators/abc",
    "/login",
    "/register",
    "/dashboard-other",
    "/assetstore",
  ])
    expect(isWorkspaceRoute(route)).toBe(false);
});

it("recognizes community pages that join the workspace only for signed-in members", () => {
  for (const path of [
    "/explore",
    "/challenges",
    "/challenges/abc",
    "/designs/abc",
    "/creators/abc",
  ])
    expect(isCommunityRoute(path)).toBe(true);
  for (const path of ["/", "/login", "/explore-other", "/admin"])
    expect(isCommunityRoute(path)).toBe(false);
});
