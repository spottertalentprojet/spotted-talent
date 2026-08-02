import { Link } from "react-router-dom";

const CONTACT_EMAIL = "contact@spottedtalent.fr";

const CGU = () => {
  return (
    <div className="min-h-screen bg-background px-6 py-12 text-foreground">
      <main className="mx-auto max-w-4xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-primary">Cadre légal</p>
        <h1 className="mb-2 text-3xl font-bold gradient-text">Mentions légales & CGU</h1>
        <p className="mb-10 text-muted-foreground">Dernière mise à jour : juillet 2026</p>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-bold">1. Éditeur du site</h2>
          <p className="text-muted-foreground">
            Le site <strong>spottedtalent.fr</strong> est édité par <strong>Spotted Talent</strong>.
            <br />
            Contact :{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary">
              {CONTACT_EMAIL}
            </a>
            <br />
            Siège social : La Ravoire, 73490, France
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-bold">2. Hébergement et prestataires techniques</h2>
          <p className="text-muted-foreground">
            Le site est hébergé par <strong>Vercel Inc.</strong>. La base de données, l'authentification,
            le stockage sécurisé et les fonctions serveur sont fournis par <strong>Supabase</strong>.
            Les paiements, abonnements, moyens de paiement et factures sont gérés par <strong>Stripe</strong>.
            Les e-mails transactionnels peuvent être envoyés par <strong>Resend</strong>. Certaines fonctions
            d'aide par intelligence artificielle peuvent utiliser <strong>Groq</strong>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-bold">3. Objet du service</h2>
          <p className="text-muted-foreground">
            Spotted Talent est une plateforme de mise en relation entre talents et entreprises. Elle permet
            aux talents de créer un profil, de postuler à des offres, d'échanger avec des recruteurs et de
            transmettre des documents demandés dans un dossier de candidature. Les entreprises peuvent publier
            des offres, suivre les candidatures, échanger avec les talents et gérer des documents liés au
            recrutement.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-bold">4. Création de compte et accès</h2>
          <p className="text-muted-foreground">
            L'utilisateur s'engage à fournir des informations exactes, à garder ses identifiants confidentiels
            et à ne pas utiliser le service pour publier des contenus illicites, trompeurs, discriminatoires ou
            contraires aux règles applicables au recrutement.
          </p>
          <p className="mt-3 text-muted-foreground">
            La création de compte peut exiger une confirmation par e-mail. Une double authentification par
            application de sécurité peut être proposée ou demandée pour renforcer la protection des accès.
          </p>
          <p className="mt-3 text-muted-foreground">
            Spotted Talent peut suspendre ou limiter un compte en cas d'usage abusif, de tentative d'accès non
            autorisé, de non-paiement, de suspicion de fraude ou de demande légitime liée à la sécurité.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-bold">5. Données personnelles</h2>
          <p className="text-muted-foreground">
            Le traitement des données personnelles est détaillé dans la{" "}
            <Link to="/confidentialite" className="text-primary hover:underline">
              politique de confidentialité
            </Link>
            . Elle explique les données collectées, les finalités, les durées de conservation, les sous-traitants
            utilisés, les droits des utilisateurs et les mesures prévues en cas d'incident de sécurité.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-bold">6. Documents et pièces administratives</h2>
          <p className="text-muted-foreground">
            Les documents transmis dans l'espace sécurisé doivent être nécessaires au recrutement ou au suivi du
            dossier concerné. Les entreprises doivent limiter leurs demandes aux pièces strictement utiles et ne
            pas demander de documents sans lien avec la candidature ou la mission.
          </p>
          <p className="mt-3 text-muted-foreground">
            Les documents partagés sont liés à une candidature acceptée ou à un dossier précis. Ils ne doivent
            pas être diffusés hors de ce cadre sans motif légitime.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-bold">7. Abonnements, essais et facturation</h2>
          <p className="text-muted-foreground">
            Les offres payantes destinées aux entreprises sont gérées via Stripe. Les prix affichés sont hors
            taxes lorsqu'ils sont indiqués comme tels. Le moyen de paiement est géré directement par Stripe :
            Spotted Talent ne stocke pas les numéros complets de carte bancaire.
          </p>
          <p className="mt-3 text-muted-foreground">
            Lorsqu'un essai gratuit est proposé, il est limité à un usage par compte entreprise. Une fois l'essai
            utilisé, les autres formules restent disponibles uniquement via paiement sécurisé.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-bold">8. Intelligence artificielle</h2>
          <p className="text-muted-foreground">
            Certaines fonctionnalités peuvent aider à analyser un CV, générer une lettre de motivation ou
            enrichir une offre d'emploi. Les contenus produits par l'IA sont fournis comme aide à la rédaction
            et doivent être relus, corrigés et validés par l'utilisateur avant utilisation.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-bold">9. Responsabilité des utilisateurs</h2>
          <p className="text-muted-foreground">
            Chaque utilisateur reste responsable des informations, offres, messages et documents qu'il transmet.
            Les contenus illicites, inexacts, abusifs ou portant atteinte aux droits d'un tiers peuvent être
            supprimés et signalés à l'adresse{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-bold">10. Propriété intellectuelle</h2>
          <p className="text-muted-foreground">
            Les contenus, textes, interfaces, logos, éléments graphiques et développements propres à Spotted
            Talent sont protégés. Toute reproduction ou exploitation non autorisée est interdite.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-bold">11. Droit applicable</h2>
          <p className="text-muted-foreground">
            Les présentes mentions légales et conditions générales sont soumises au droit français. En cas de
            litige, les parties chercheront d'abord une solution amiable avant toute action devant les juridictions
            compétentes.
          </p>
        </section>

        <div className="mt-12 border-t border-border/50 pt-6 text-center text-sm text-muted-foreground">
          © 2026 Spotted Talent - Tous droits réservés
        </div>
      </main>
    </div>
  );
};

export default CGU;
