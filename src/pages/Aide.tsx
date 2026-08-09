import { Link } from "react-router-dom";
import { ArrowLeft, Building2, Clock3, Download, ShieldCheck, Sparkles } from "lucide-react";
import { DOCUMENT_RETENTION_DAYS } from "@/lib/documentRetention";

const Aide = () => (
  <div className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6">
    <main className="mx-auto max-w-5xl space-y-6">
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Retour à l’accueil
      </Link>

      <section className="overflow-hidden rounded-3xl border border-border/70 bg-card/80 shadow-sm">
        <div className="border-b border-border/60 bg-gradient-to-br from-primary/10 via-background to-accent/10 px-6 py-8 sm:px-9">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary"><Sparkles className="h-4 w-4" /> Centre d’aide Spotted Talent</div>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Conservation des documents</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            Spotted Talent transmet les fichiers de manière sécurisée pendant une durée limitée. Le service n’est pas
            une archive légale : chaque destinataire doit télécharger la copie qu’il souhaite conserver.
          </p>
        </div>

        <div className="grid gap-4 p-5 sm:p-7 lg:grid-cols-2">
          <article className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-300"><ShieldCheck className="h-5 w-5" /></div>
            <h2 className="mt-4 text-lg font-bold">Document envoyé par un talent</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Dès que l’entreprise télécharge le document ou confirme l’avoir reçu, un délai de sécurité de
              {` ${DOCUMENT_RETENTION_DAYS.talentDocumentAfterReceipt} jours`} commence. Le fichier est ensuite
              supprimé automatiquement.
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Si l’entreprise ne le télécharge pas et ne confirme rien, le fichier est supprimé
              {` ${DOCUMENT_RETENTION_DAYS.talentDocumentWithoutReceipt} jours`} après son envoi. La demande et ses
              dates restent enregistrées pour la traçabilité.
            </p>
          </article>

          <article className="rounded-2xl border border-primary/20 bg-primary/[0.06] p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary"><Building2 className="h-5 w-5" /></div>
            <h2 className="mt-4 text-lg font-bold">Document envoyé au talent</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Un contrat, une fiche de paie ou un document d’intérim transmis par une entreprise reste disponible
              pendant {DOCUMENT_RETENTION_DAYS.companyDocumentDelivery} jours après l’envoi, puis le fichier est
              supprimé automatiquement.
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Après la remise, l’entreprise voit la trace de son envoi mais ne peut plus ouvrir ou retélécharger le
              contenu. Le talent peut redemander le document directement à son employeur.
            </p>
          </article>
        </div>

        <div className="grid gap-3 border-t border-border/60 bg-secondary/15 px-5 py-5 sm:grid-cols-3 sm:px-7">
          <div className="flex items-start gap-3"><Download className="mt-0.5 h-4 w-4 text-primary" /><p className="text-xs leading-5 text-muted-foreground"><strong className="block text-foreground">Téléchargez votre copie</strong>Conservez ailleurs les documents dont vous avez besoin.</p></div>
          <div className="flex items-start gap-3"><Clock3 className="mt-0.5 h-4 w-4 text-primary" /><p className="text-xs leading-5 text-muted-foreground"><strong className="block text-foreground">Suppression quotidienne</strong>Les fichiers arrivés à échéance sont traités une fois par jour.</p></div>
          <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-4 w-4 text-primary" /><p className="text-xs leading-5 text-muted-foreground"><strong className="block text-foreground">Traçabilité minimale</strong>Les dates utiles restent journalisées sans conserver le fichier.</p></div>
        </div>
      </section>

      <p className="text-center text-sm text-muted-foreground">
        Pour le texte contractuel complet, consultez les <Link to="/cgu" className="font-medium text-primary hover:underline">CGU</Link> et la <Link to="/confidentialite" className="font-medium text-primary hover:underline">politique de confidentialité</Link>.
      </p>
    </main>
  </div>
);

export default Aide;
