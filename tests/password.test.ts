import { describe, it, expect } from "vitest";
import { passwordChecklist, validNewPassword } from "../src/lib/password";
describe("new account password checks", () => {
  it("starts empty with no checks satisfied", () => {
    expect(passwordChecklist("", "").filter((c) => c.met)).toHaveLength(0);
  });
  it("requires every composition rule and the length boundaries", () => {
    for (const password of [
      "shortA1!",
      "alllowercase1!",
      "ALLUPPERCASE1!",
      "NoNumbersHere!",
      "NoSymbolsHere1",
      "Password123 ",
    ])
      expect(validNewPassword(password)).toBe(false);
    expect(validNewPassword("Ab1!" + "x".repeat(6))).toBe(true);
    expect(validNewPassword("Ab1!" + "x".repeat(124))).toBe(true);
    expect(validNewPassword("Ab1!" + "x".repeat(125))).toBe(false);
  });
  it("does not satisfy confirmation for empty or different values", () => {
    expect(
      passwordChecklist("Valid-password123", "wrong").filter((c) => c.met),
    ).toHaveLength(5);
    expect(
      passwordChecklist("Valid-password123", "Valid-password123").filter(
        (c) => c.met,
      ),
    ).toHaveLength(6);
  });
  it("compares exact values without silently trimming passwords", () => {
    expect(
      passwordChecklist("Valid-password123 ", "Valid-password123").at(-1)?.met,
    ).toBe(false);
    expect(
      passwordChecklist("Valid-password123 ", "Valid-password123 ").at(-1)?.met,
    ).toBe(true);
  });
});
