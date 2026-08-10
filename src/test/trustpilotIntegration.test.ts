import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const badgeSource = readFileSync("src/components/TrustpilotFooterBadge.tsx", "utf8");
const mainFooterSource = readFileSync("src/components/Footer.tsx", "utf8");
const enterpriseLandingSource = readFileSync("src/pages/EntrepriseLanding.tsx", "utf8");
const vercelConfig = readFileSync("vercel.json", "utf8");

describe("Trustpilot footer integration", () => {
  it("links only to the Spotted Talent profile and review form", () => {
    expect(badgeSource).toContain("fr.trustpilot.com/review/spottedtalent.fr");
    expect(badgeSource).toContain("fr.trustpilot.com/evaluate/spottedtalent.fr");
    expect(badgeSource).not.toMatch(/TrustScore|[1-5][.,][0-9]\s*\/\s*5/);
  });

  it("uses the official logo in both public footers", () => {
    expect(badgeSource).toContain("cdn.trustpilot.net/brand-assets/4.3.0/logo-black.svg");
    expect(mainFooterSource).toContain("<TrustpilotFooterBadge />");
    expect(enterpriseLandingSource).toContain("<TrustpilotFooterBadge compact />");
    expect(vercelConfig).toContain("https://cdn.trustpilot.net");
  });
});
