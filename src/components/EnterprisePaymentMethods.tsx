import { Landmark, LockKeyhole } from "lucide-react";

const paymentBadgeClass =
  "flex min-h-11 items-center justify-center rounded-xl border border-border/70 bg-background/80 px-4 shadow-sm";

const EnterprisePaymentMethods = () => (
  <section
    aria-labelledby="enterprise-payment-methods-title"
    className="rounded-2xl border border-border/60 bg-card/60 p-4 sm:p-5"
  >
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <LockKeyhole className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 id="enterprise-payment-methods-title" className="text-sm font-semibold text-foreground">
            Paiements sécurisés
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Cartes traitées par Stripe. Virement SEPA disponible sur demande.
          </p>
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Moyens de paiement proposés">
        <li className={paymentBadgeClass} aria-label="Visa">
          <span className="text-lg font-black italic tracking-[-0.08em] text-[#1434CB]" aria-hidden="true">
            VISA
          </span>
        </li>

        <li className={paymentBadgeClass} aria-label="Mastercard">
          <span className="flex items-center gap-2" aria-hidden="true">
            <span className="relative block h-6 w-9">
              <span className="absolute left-0 top-0 h-6 w-6 rounded-full bg-[#EB001B]" />
              <span className="absolute right-0 top-0 h-6 w-6 rounded-full bg-[#F79E1B] opacity-90" />
            </span>
            <span className="text-[11px] font-bold tracking-tight text-foreground">mastercard</span>
          </span>
        </li>

        <li className={paymentBadgeClass} aria-label="Paiement sécurisé par Stripe">
          <span className="text-xl font-extrabold tracking-[-0.06em] text-[#635BFF]" aria-hidden="true">
            stripe
          </span>
        </li>

        <li className={paymentBadgeClass} aria-label="Virement SEPA disponible sur demande">
          <span className="flex items-center gap-2 text-[#0B4A7D] dark:text-sky-300" aria-hidden="true">
            <Landmark className="h-5 w-5" />
            <span className="leading-none">
              <span className="block text-xs font-extrabold tracking-wide">SEPA</span>
              <span className="mt-0.5 block text-[9px] font-medium uppercase tracking-wider">Virement</span>
            </span>
          </span>
        </li>
      </ul>
    </div>
  </section>
);

export default EnterprisePaymentMethods;
