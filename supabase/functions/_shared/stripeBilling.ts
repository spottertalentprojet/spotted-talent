import type Stripe from "npm:stripe@14.25.0";

const FRENCH_VAT_RATE_PERCENT = 20;
const FRENCH_VAT_MARKER = "spotted_talent_fr_vat_20";

export const getOrCreateFrenchVatRate = async (stripe: Stripe) => {
  const taxRates = await stripe.taxRates.list({ active: true, limit: 100 });
  const existingRate = taxRates.data.find((rate) => (
    rate.metadata?.spotted_talent_rate === FRENCH_VAT_MARKER ||
    (
      rate.country === "FR" &&
      rate.inclusive === false &&
      Number(rate.percentage) === FRENCH_VAT_RATE_PERCENT
    )
  ));

  if (existingRate) return existingRate.id;

  const taxRate = await stripe.taxRates.create({
    display_name: "TVA",
    description: "TVA France 20 %",
    jurisdiction: "France",
    country: "FR",
    percentage: FRENCH_VAT_RATE_PERCENT,
    inclusive: false,
    metadata: {
      spotted_talent_rate: FRENCH_VAT_MARKER,
    },
  });

  return taxRate.id;
};

export const buildInvoiceCustomFields = (siret?: string | null, vatNumber?: string | null) => {
  const fields: Array<{ name: string; value: string }> = [];
  const normalizedSiret = String(siret || "").replace(/\D/g, "").slice(0, 14);
  const normalizedVatNumber = String(vatNumber || "").trim().slice(0, 40);

  if (normalizedSiret) fields.push({ name: "SIRET", value: normalizedSiret });
  if (normalizedVatNumber) fields.push({ name: "N° TVA", value: normalizedVatNumber });

  return fields;
};
