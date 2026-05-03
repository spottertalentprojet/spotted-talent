const CGU = () => {
  return (
    <div className="min-h-screen bg-background text-foreground px-6 py-12 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 gradient-text">Mentions légales & CGU</h1>
      <p className="text-muted-foreground mb-10">Dernière mise à jour : mars 2026</p>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">1. Éditeur du site</h2>
        <p className="text-muted-foreground">
          Le site <strong>spottedtalent.fr</strong> est édité par <strong>Spotted Talent</strong>.<br />
          Email : <a href="mailto:contact@spottedtalent.fr" className="text-primary">contact@spottedtalent.fr</a><br />
          Siège social : La Ravoire, 73490, France
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">2. Hébergement</h2>
        <p className="text-muted-foreground">
          Le site est hébergé par <strong>Vercel Inc.</strong>, 340 Pine Street, San Francisco, CA 94104, USA.<br />
          Base de données hébergée par <strong>Supabase</strong>, 970 Toa Payoh North, Singapour.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">3. Objet du service</h2>
        <p className="text-muted-foreground">
          Spotted Talent est une plateforme de mise en relation entre talents (candidats) et entreprises.
          Elle permet aux talents de créer un profil, d'analyser leur CV grâce à l'IA, de postuler à des offres
          et de générer des lettres de motivation. Les entreprises peuvent publier des offres d'emploi et
          consulter les candidatures reçues.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">4. Données personnelles (RGPD)</h2>
        <p className="text-muted-foreground">
          Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :
        </p>
        <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
          <li>Droit d'accès à vos données</li>
          <li>Droit de rectification</li>
          <li>Droit à l'effacement ("droit à l'oubli")</li>
          <li>Droit à la portabilité</li>
          <li>Droit d'opposition</li>
        </ul>
        <p className="text-muted-foreground mt-3">
          Pour exercer ces droits, contactez-nous à : <a href="mailto:contact@spottedtalent.fr" className="text-primary">contact@spottedtalent.fr</a>
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">5. Données collectées</h2>
        <p className="text-muted-foreground">
          Nous collectons les données suivantes : nom, email, CV, photo de profil, lettres de motivation et documents professionnels.
          Ces données sont utilisées uniquement dans le cadre du service Spotted Talent et ne sont jamais revendues à des tiers.
          Les données sont conservées pendant toute la durée d'utilisation du compte, puis supprimées sur demande.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">6. Cookies</h2>
        <p className="text-muted-foreground">
          Le site utilise uniquement des cookies techniques nécessaires au fonctionnement du service (authentification, session utilisateur).
          Aucun cookie publicitaire ou de tracking tiers n'est utilisé.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">7. Intelligence Artificielle</h2>
        <p className="text-muted-foreground">
          Spotted Talent utilise des services d'intelligence artificielle (Groq/LLaMA) pour l'analyse de CV et la génération de lettres de motivation.
          Les données transmises à ces services sont utilisées uniquement pour générer les résultats demandés et ne sont pas conservées par ces services.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">8. Responsabilité</h2>
        <p className="text-muted-foreground">
          Spotted Talent ne peut être tenu responsable des contenus publiés par les utilisateurs (offres, profils).
          Tout contenu illicite peut être signalé à : <a href="mailto:contact@spottedtalent.fr" className="text-primary">contact@spottedtalent.fr</a>
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">9. Propriété intellectuelle</h2>
        <p className="text-muted-foreground">
          L'ensemble des contenus présents sur le site (logo, textes, design) est la propriété exclusive de Spotted Talent.
          Toute reproduction sans autorisation préalable est interdite.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">10. Droit applicable</h2>
        <p className="text-muted-foreground">
          Les présentes CGU sont soumises au droit français. Tout litige sera porté devant les tribunaux compétents de Chambéry, France.
        </p>
      </section>

      <div className="mt-12 pt-6 border-t border-border/50 text-center text-muted-foreground text-sm">
        © 2026 Spotted Talent — Tous droits réservés
      </div>
    </div>
  );
};

export default CGU;