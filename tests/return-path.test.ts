import { it, expect } from "vitest";
import { safeReturnPath, signInPath } from "../src/lib/return-path";
it("preserves supported internal destinations and challenge query strings", () => {
  for (const path of [
    "/explore",
    "/challenges",
    "/designs/012345678901234567890123",
    "/challenges/012345678901234567890123",
    "/projects/new?challenge=012345678901234567890123",
  ])
    expect(safeReturnPath(path)).toBe(path);
});
it("rejects external, protocol-relative, encoded and malformed redirect destinations", () => {
  for (const path of [
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/\nevil",
    "/%2f%2fevil.example",
    "/unknown-route",
    "javascript:alert(1)",
    null,
  ])
    expect(safeReturnPath(path)).toBe("/dashboard");
});
it("keeps the destination while switching sign-in/register forms", () => {
  expect(signInPath("/explore")).toBe("/login?next=%2Fexplore");
  expect(signInPath("/challenges", true)).toBe("/register?next=%2Fchallenges");
});
