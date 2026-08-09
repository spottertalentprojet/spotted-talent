import { describe, expect, it } from "vitest";
import { validateProfileImage } from "@/lib/profileMedia";

describe("validateProfileImage", () => {
  it("refuse les formats exécutables ou vectoriels", () => {
    expect(validateProfileImage(new File(["<svg />"], "logo.svg", { type: "image/svg+xml" }))).toContain("refusée");
  });

  it("accepte une image web sûre sous 2 Mo", () => {
    expect(validateProfileImage(new File(["image"], "logo.webp", { type: "image/webp" }))).toBeNull();
  });
});
