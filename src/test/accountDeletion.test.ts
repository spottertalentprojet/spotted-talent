import { describe, expect, it } from "vitest";
import {
  ACCOUNT_DELETION_CONFIRMATION,
  clearAccountLocalState,
  isAccountDeletionConfirmed,
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
});
