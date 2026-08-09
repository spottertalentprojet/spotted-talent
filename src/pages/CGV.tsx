import type React from "react";
import { Link } from "react-router-dom";
import { LEGAL_EFFECTIVE_DATE, SALES_TERMS_VERSION } from "@/lib/legal";
import { SUPPORT_EMAIL } from "@/lib/contact";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-sm">
    <h2 className="mb-3 text-xl font-bold text-foreground">{title}</h2>
    <div className="space-y-3 text-sm leading-7 text-muted-foreground">{children}</div>
  </section>
);

const CGV = () => (
  <div className="min-h-screen bg-background px-6 py-12 text-foreground">
    <main className="mx-auto max-w-5xl space-y-8">
      <div>
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-primary">Abonnements professionnels</p>
        <h1 className="mb-2 text-3xl font-bold gradient-text">Conditions générales de vente — Entreprises</h1>
        <p className="text-muted-foreground">
          Version {SALES_TERMS_VERSION.split("-").reverse().join("/")} — applicable à compter du {LEGAL_EFFECTIVE_DATE.split("-").reverse().join("/")}.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm leading-6 text-foreground">
        <p className="font-semibold">Conditions publiées avant l’ouverture commerciale prochaine.</p>
        <p className="mt-1 text-muted-foreground">
          Ces conditions s’appliqueront à toute commande dès l’activation des abonnements. L’éditeur est Yousri
          Frigui, entrepreneur individuel, SIREN 838 378 156, dont l’établissement principal est situé 6 R du Pre
          Hibou, 73490 La Ravoire. La formule, le prix, le cycle et la date de fin d’essai seront récapitulés avant la
          confirmation du paiement sécurisé.
        </p>
      </div>

      <Section title="1. Champ d’application">
        <p>
          Ces conditions encadrent les abonnements Spotted Talent souscrits exclusivement par des professionnels
          agissant pour les besoins de leur activité. L’espace Talent reste gratuit, sauf évolution clairement
          annoncée avant utilisation.
        </p>
        <p>
          Les CGU s’appliquent à l’utilisation générale de la plateforme. Les présentes CGV prévalent uniquement en
          cas de contradiction portant sur la commande, le prix, l’abonnement, la résiliation ou la responsabilité
          liée au service payant Entreprise.
        </p>
      </Section>

      <Section title="2. Description des offres">
        <p>
          Le détail à jour de chaque formule, de ses limites et de ses éventuelles options est présenté dans
          l’espace Abonnement avant la commande. Les fonctions peuvent inclure la publication d’offres, le suivi des
          candidatures, la messagerie, les dossiers documentaires et des outils d’aide à la rédaction.
        </p>
        <p>
          Les scores de correspondance sont indicatifs et calculés à partir de critères déclarés. Ils ne constituent
          ni une décision de recrutement ni une garantie de résultat.
        </p>
      </Section>

      <Section title="3. Prix, TVA et commande">
        <p>
          Les prix sont affichés hors taxes. Le récapitulatif Stripe présente avant validation la formule, la
          périodicité, les options, les taxes applicables et le total à payer. La commande devient définitive après
          validation du paiement sécurisé et confirmation de l’abonnement.
        </p>
        <p>
          Les informations complètes de facturation et un SIRET vérifié peuvent être demandés avant l’activation du
          service. Spotted Talent ne conserve pas le numéro complet de la carte bancaire.
        </p>
        <p>
          Avant l’ouverture de Stripe, le client doit accepter la version datée des présentes CGV. La version, le
          compte, la date serveur, la formule et le cycle choisis sont conservés avec l’événement de commande. Toute
          commande implique que le signataire dispose du pouvoir d’engager l’entreprise cliente.
        </p>
      </Section>

      <Section title="4. Essai de 30 jours">
        <p>
          Lorsqu’il est proposé, l’essai est limité à une utilisation par compte entreprise et nécessite
          l’enregistrement d’un moyen de paiement. Aucun débit d’abonnement n’intervient avant la fin des 30 jours.
          À défaut de résiliation avant cette date, l’abonnement sélectionné commence automatiquement et le premier
          paiement devient exigible.
        </p>
      </Section>

      <Section title="5. Droit de rétractation professionnel">
        <p>
          Les offres sont conclues exclusivement avec des professionnels pour les besoins de leur activité. Elles ne
          bénéficient donc pas du droit de rétractation réservé aux consommateurs. Si une règle impérative étend
          exceptionnellement ce droit au client, notamment pour un contrat hors établissement répondant aux conditions
          de l’article L. 221-3 du Code de la consommation, cette règle demeure pleinement applicable.
        </p>
      </Section>

      <Section title="6. Durée, renouvellement, résiliation et remboursement">
        <p>
          L’abonnement est mensuel ou annuel selon le choix effectué et se renouvelle pour une période identique.
          L’entreprise peut demander sa résiliation depuis le portail de facturation accessible dans son dashboard.
          La résiliation prend effet à la fin de la période déjà facturée. Le service reste disponible jusque-là.
        </p>
        <p>
          Le système actuel n’applique pas de prorata ni de remboursement automatique d’une période commencée, sauf
          disposition légale contraire ou geste commercial confirmé par écrit.
        </p>
      </Section>

      <Section title="7. Incident de paiement">
        <p>
          En cas d’échec ou de retard de paiement, l’accès aux fonctions payantes peut être limité après information
          du client. Le paiement et le moyen de paiement peuvent être régularisés depuis le portail Stripe.
        </p>
      </Section>

      <Section title="8. Évolution des offres, des prix et des CGV">
        <p>
          Toute modification substantielle ou hausse de prix applicable à une période future est annoncée par e-mail
          ou dans l’espace connecté au moins 30 jours avant le renouvellement concerné. Le client peut résilier avant
          ce renouvellement s’il refuse les nouvelles conditions. Une modification légale, de sécurité ou purement
          favorable peut s’appliquer plus rapidement avec information dès que possible.
        </p>
      </Section>

      <Section title="9. Disponibilité et maintenance">
        <p>
          Spotted Talent met en œuvre des moyens raisonnables pour assurer l’accès au service. Des interruptions
          peuvent intervenir pour maintenance, sécurité ou incident technique. Aucune fonctionnalité d’aide ne
          garantit un recrutement, une candidature retenue ou l’absence d’erreur.
        </p>
      </Section>

      <Section title="10. Obligations du client professionnel">
        <p>
          Le client reste responsable de ses offres, décisions, messages et demandes de documents. Il s’engage à
          respecter le droit du travail, la non-discrimination, la protection des données et la limitation des
          pièces demandées à ce qui est directement nécessaire au poste.
        </p>
        <p>
          Le client ne doit jamais fonder une décision uniquement sur un score, une suggestion automatisée ou un
          contenu généré. Il désigne les personnes habilitées, vérifie les résultats, traite toute contestation et
          s’interdit d’introduire un critère sensible ou discriminatoire dans les fonctions d’aide.
        </p>
        <p>
          Avant chaque publication ou modification substantielle, le client confirme que l’emploi est réel, que les
          informations sont exactes, que la candidature est gratuite et que les critères respectent la
          non-discrimination. Les contrôles automatiques de Spotted Talent ne remplacent pas cette vérification et ne
          constituent pas une validation juridique du contenu.
        </p>
        <p>
          Une offre signalée reste examinée humainement. En cas de suspension, le motif est conservé et présenté dans
          l’espace du client. Celui-ci peut demander un réexamen à l’adresse de contact en indiquant la référence
          publique de l’annonce et tout élément utile à sa contestation.
        </p>
      </Section>

      <Section title="11. Intelligence artificielle, transparence et supervision humaine">
        <p>
          Le matching actuellement fourni est un calcul explicable par règles déclarées. Les aides à la rédaction et
          à l’analyse ne prennent aucune décision de recrutement. Spotted Talent documente leur destination, leurs
          limites, les risques prévisibles et les incidents signalés, et réévalue leur qualification au regard du
          règlement (UE) 2024/1689 avant toute évolution susceptible d’influencer matériellement une sélection.
        </p>
        <p>
          Le client conserve une supervision humaine effective, informe les personnes lorsque la réglementation
          l’exige et peut ignorer ou corriger tout résultat. Les caractéristiques protégées et données sensibles ne
          doivent pas servir de critères de sélection.
        </p>
      </Section>

      <Section title="12. Données et confidentialité">
        <p>
          Les traitements de données sont décrits dans la{" "}
          <Link to="/confidentialite" className="text-primary hover:underline">politique de confidentialité</Link>.
          Les documents d’un candidat ne peuvent être utilisés que pour le dossier et la finalité annoncés.
        </p>
      </Section>

      <Section title="13. Responsabilité et force majeure">
        <p>
          Dans la mesure permise par la loi, Spotted Talent n’est pas responsable des dommages indirects tels que perte
          de chiffre d’affaires, de marge, d’opportunité commerciale, d’image ou économies espérées. Sa responsabilité
          cumulée au titre d’un même fait ou de faits liés est plafonnée au montant hors taxes effectivement payé par
          le client au cours des douze mois précédant le fait générateur.
        </p>
        <p>
          Ce plafond et ces exclusions ne s’appliquent pas en cas de faute lourde ou dolosive, dommage corporel,
          atteinte imputable à une obligation de confidentialité ou de protection des données, violation des droits de
          propriété intellectuelle d’un tiers, ni lorsqu’une règle impérative l’interdit. Ils ne peuvent pas vider une
          obligation essentielle de sa substance. Aucune partie n’est responsable d’un manquement dû à un cas de force
          majeure reconnu par le droit français pendant sa durée.
        </p>
      </Section>

      <Section title="14. Réclamation, droit applicable et juridiction">
        <p>
          Les présentes conditions sont soumises au droit français. Avant toute action, les parties chercheront une
          solution amiable en écrivant à{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">{SUPPORT_EMAIL}</a>.
          À défaut d’accord, les juridictions matériellement et territorialement compétentes sont saisies, sous réserve
          des règles impératives applicables. La médiation de la consommation ne s’applique pas aux commandes conclues
          exclusivement entre professionnels.
        </p>
      </Section>

      <div className="border-t border-border/50 pt-6 text-center text-sm text-muted-foreground">
        <Link to="/cgu" className="text-primary hover:underline">Consulter les CGU</Link>
      </div>
    </main>
  </div>
);

export default CGV;
