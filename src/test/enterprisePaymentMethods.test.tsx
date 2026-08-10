import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import EnterprisePaymentMethods from "@/components/EnterprisePaymentMethods";

describe("EnterprisePaymentMethods", () => {
  it("présente clairement les cartes, Stripe et le statut réel du SEPA", () => {
    render(<EnterprisePaymentMethods />);

    expect(screen.getByRole("heading", { name: "Paiements sécurisés" })).toBeInTheDocument();
    expect(screen.getByLabelText("Visa")).toBeInTheDocument();
    expect(screen.getByLabelText("Mastercard")).toBeInTheDocument();
    expect(screen.getByLabelText("Paiement sécurisé par Stripe")).toBeInTheDocument();
    expect(screen.getByLabelText("Virement SEPA disponible sur demande")).toBeInTheDocument();
    expect(screen.getByText("Cartes traitées par Stripe. Virement SEPA disponible sur demande.")).toBeInTheDocument();
  });
});
