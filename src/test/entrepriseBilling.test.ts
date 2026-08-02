import { describe, expect, it } from "vitest";
import {
  ABONNEMENT_PLANS,
  getBillingPlanEntitlements,
  getPlanPriceCents,
} from "@/lib/entrepriseBilling";

describe("enterprise billing plans", () => {
  it("keeps the advertised prices without a permanent yearly discount", () => {
    expect(getPlanPriceCents("starter", "monthly")).toBe(3_900);
    expect(getPlanPriceCents("starter", "yearly")).toBe(46_800);
    expect(getPlanPriceCents("boost", "yearly")).toBe(178_800);
    expect(getPlanPriceCents("premium", "yearly")).toBe(418_800);
  });

  it("makes Boost cumulative with Starter", () => {
    const boost = getBillingPlanEntitlements("boost");
    expect(boost.maxActiveOffers).toBe(5);
    expect(boost.maxWeeklyNewOffers).toBe(5);
    expect(boost.screeningQuestions).toBe(true);
    expect(boost.automatedCandidateMessages).toBe(true);
    expect(boost.urgentBadge).toBe(true);
  });

  it("makes Premium cumulative with Starter and Boost", () => {
    const premium = getBillingPlanEntitlements("premium");
    expect(premium.maxActiveOffers).toBeNull();
    expect(premium.maxWeeklyNewOffers).toBeNull();
    expect(Object.values(premium).every((value) => value === true || value === null)).toBe(true);
    expect(ABONNEMENT_PLANS.find((plan) => plan.id === "premium")?.features)
      .toContain("Tout Starter et Boost inclus");
  });

  it("limits Starter to one new offer every 7 days", () => {
    const starter = getBillingPlanEntitlements("starter");
    expect(starter.maxActiveOffers).toBe(1);
    expect(starter.maxWeeklyNewOffers).toBe(1);
  });
});
