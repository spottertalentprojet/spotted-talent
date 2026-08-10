import { describe, expect, it } from "vitest";
import {
  ACCOUNT_DELETION_CONFIRMATION,
  ACCOUNT_DELETION_FEEDBACK_MAX_LENGTH,
  ACCOUNT_DELETION_REASON_OPTIONS,
  clearAccountLocalState,
  isAccountDeletionConfirmed,
  isAccountDeletionReason,
  normalizeAccountDeletionFeedback,
} from "@/lib/accountDeletion";

describe("account deletion safeguards", () => {
  it("requires the exact confirmation phrase", () => {
    expect(isAccountDeletionConfirmed(ACCOUNT_DELETION_CONFIRMATION)).toBe(true);
    expect(isAccountDeletionConfirmed(` ${ACCOUNT_DELETION_CONFIRMATION} `)).toBe(true);
    expect(isAccountDeletionConfirmed("SUPPRIMER")).toBe(false);
    expect(isAccountDeletionConfirmed("supprimer mon compte")).toBe(false);
  });

  it("clears only application keys from local storage", () => {
    localStorage.setItem("spotted-talent:talent-active-tab", "documents");
    localStorage.setItem("spottedtalent_intro", "1");
    localStorage.setItem("another-application", "keep");
    sessionStorage.setItem("spottedtalent_account_notice", "test");

    clearAccountLocalState();

    expect(localStorage.getItem("spotted-talent:talent-active-tab")).toBeNull();
    expect(localStorage.getItem("spottedtalent_intro")).toBeNull();
    expect(localStorage.getItem("another-application")).toBe("keep");
    expect(sessionStorage.length).toBe(0);
  });

  it("exposes unique and valid departure reasons", () => {
    const values = ACCOUNT_DELETION_REASON_OPTIONS.map(({ value }) => value);
    expect(new Set(values).size).toBe(values.length);
    expect(values).toContain("prefer_not_to_say");
    expect(values.every(isAccountDeletionReason)).toBe(true);
    expect(isAccountDeletionReason("unknown_reason")).toBe(false);
  });

  it("keeps feedback optional, trimmed and limited", () => {
    expect(normalizeAccountDeletionFeedback("found_job", "  Merci pour le service  ")).toEqual({
      reason: "found_job",
      feedback: "Merci pour le service",
    });
    expect(normalizeAccountDeletionFeedback("invalid", "   ")).toEqual({
      reason: "prefer_not_to_say",
      feedback: null,
    });
    expect(normalizeAccountDeletionFeedback(undefined, "x".repeat(900)).feedback).toHaveLength(
      ACCOUNT_DELETION_FEEDBACK_MAX_LENGTH,
    );
  });
});
