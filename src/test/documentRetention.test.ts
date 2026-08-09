import { describe, expect, it } from "vitest";
import {
  canReadDeliveredDocument,
  DOCUMENT_RETENTION_DAYS,
  getInitialDocumentExpiry,
  getTalentDocumentReceiptExpiry,
} from "@/lib/documentRetention";

describe("document retention lifecycle", () => {
  const sentAt = new Date("2026-08-09T10:00:00.000Z");

  it("expires an unclaimed talent document after 30 days", () => {
    expect(getInitialDocumentExpiry("shared-requested", sentAt).toISOString())
      .toBe("2026-09-08T10:00:00.000Z");
    expect(DOCUMENT_RETENTION_DAYS.talentDocumentWithoutReceipt).toBe(30);
  });

  it("starts a fixed seven-day grace period at first receipt", () => {
    const firstReceipt = new Date("2026-08-20T12:30:00.000Z");
    expect(getTalentDocumentReceiptExpiry(firstReceipt).toISOString())
      .toBe("2026-08-27T12:30:00.000Z");
    expect(DOCUMENT_RETENTION_DAYS.talentDocumentAfterReceipt).toBe(7);
  });

  it.each(["shared-contrat", "shared-fiche-paie", "shared-interim"])(
    "keeps a %s delivery available to the talent for 90 days",
    (category) => {
      expect(getInitialDocumentExpiry(category, sentAt).toISOString())
        .toBe("2026-11-07T10:00:00.000Z");
    },
  );

  it("removes company and administrator content access immediately after delivery", () => {
    expect(canReadDeliveredDocument({
      flow: "company_to_talent",
      actorRole: "entreprise",
      isOwner: true,
      isRecipient: false,
      storageDeleted: false,
    })).toBe(false);

    expect(canReadDeliveredDocument({
      flow: "company_to_talent",
      actorRole: "admin",
      isOwner: false,
      isRecipient: false,
      storageDeleted: false,
    })).toBe(false);

    expect(canReadDeliveredDocument({
      flow: "company_to_talent",
      actorRole: "talent",
      isOwner: false,
      isRecipient: true,
      storageDeleted: false,
    })).toBe(true);
  });

  it("denies every content access after the Storage object is deleted", () => {
    expect(canReadDeliveredDocument({
      flow: "talent_to_company",
      actorRole: "talent",
      isOwner: true,
      isRecipient: false,
      storageDeleted: true,
    })).toBe(false);
  });
});
