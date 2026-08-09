import { Checkbox } from "@/components/ui/checkbox";
import { PRIVACY_NOTICE_VERSION_LABEL, TERMS_VERSION_LABEL } from "@/lib/legal";

type LegalAcknowledgementFieldsProps = {
  termsAccepted: boolean;
  privacyAcknowledged: boolean;
  onTermsAcceptedChange: (checked: boolean) => void;
  onPrivacyAcknowledgedChange: (checked: boolean) => void;
  disabled?: boolean;
};

const LegalAcknowledgementFields = ({
  termsAccepted,
  privacyAcknowledged,
  onTermsAcceptedChange,
  onPrivacyAcknowledgedChange,
  disabled = false,
}: LegalAcknowledgementFieldsProps) => (
  <div className="space-y-3 rounded-2xl border border-border/70 bg-background/55 p-4 text-left">
    <label className="flex cursor-pointer items-start gap-3 text-xs leading-5 text-muted-foreground">
      <Checkbox
        className="mt-0.5"
        checked={termsAccepted}
        onCheckedChange={(checked) => onTermsAcceptedChange(checked === true)}
        disabled={disabled}
        required
        aria-label="Accepter les conditions générales d'utilisation"
      />
      <span>
        J’accepte les{" "}
        <a
          href="/cgu"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-primary hover:underline"
        >
          conditions générales d’utilisation
        </a>{" "}
        (version du {TERMS_VERSION_LABEL}).
      </span>
    </label>

    <label className="flex cursor-pointer items-start gap-3 text-xs leading-5 text-muted-foreground">
      <Checkbox
        className="mt-0.5"
        checked={privacyAcknowledged}
        onCheckedChange={(checked) => onPrivacyAcknowledgedChange(checked === true)}
        disabled={disabled}
        required
        aria-label="Confirmer la lecture de la politique de confidentialité"
      />
      <span>
        Je reconnais avoir lu la{" "}
        <a
          href="/confidentialite"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-primary hover:underline"
        >
          politique de confidentialité
        </a>{" "}
        (version du {PRIVACY_NOTICE_VERSION_LABEL}). Cette case confirme
        uniquement que l’information m’a été présentée ; elle ne vaut pas consentement publicitaire.
      </span>
    </label>
  </div>
);

export default LegalAcknowledgementFields;
