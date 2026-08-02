import { describe, expect, it } from "vitest";
import { canTalentReplyToExchange, hasHumanCompanyMessage, isCandidateExchangeClosed } from "@/lib/candidateExchange";

describe("candidate exchanges", () => {
  const talentId = "talent-1";
  const companyId = "company-1";

  it("does not let an automated company message open an exchange", () => {
    expect(hasHumanCompanyMessage([{ expedition_id: companyId, automated: true }], talentId)).toBe(false);
  });

  it("opens the exchange after a human company message", () => {
    expect(canTalentReplyToExchange([{ expedition_id: companyId, automated: false }], talentId, "entretien")).toBe(true);
  });

  it("does not let the talent open the exchange with their own message", () => {
    expect(canTalentReplyToExchange([{ expedition_id: talentId, automated: false }], talentId, "envoyee")).toBe(false);
  });

  it("keeps a refused candidature read-only", () => {
    expect(isCandidateExchangeClosed("refusee")).toBe(true);
    expect(canTalentReplyToExchange([{ expedition_id: companyId, automated: false }], talentId, "refusee")).toBe(false);
  });
});
