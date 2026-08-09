import { describe, expect, it } from "vitest";
import { canEnrollMfaForRole, isMfaMandatoryForRole } from "@/lib/mfaPolicy";

describe("politique de double authentification", () => {
  it("ne propose pas l’enrôlement aux talents", () => {
    expect(canEnrollMfaForRole("talent")).toBe(false);
  });

  it("le propose aux entreprises et aux administrateurs", () => {
    expect(canEnrollMfaForRole("entreprise")).toBe(true);
    expect(canEnrollMfaForRole("admin")).toBe(true);
  });

  it("l'impose uniquement aux comptes entreprise", () => {
    expect(isMfaMandatoryForRole("entreprise")).toBe(true);
    expect(isMfaMandatoryForRole("talent")).toBe(false);
    expect(isMfaMandatoryForRole("admin")).toBe(false);
  });
});
