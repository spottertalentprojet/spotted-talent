# Scan fonctions et sécurité - Spotted Talent

Date : 26 juillet 2026

## Vérifications effectuées

- Build web local : réussi.
- Tests automatiques : réussis, 6 tests passés.
- Lint : aucune erreur bloquante, uniquement des avertissements existants.
- Déploiement Vercel production : réussi.
- Site officiel : https://www.spottedtalent.fr actif.
- Pages légales vérifiées :
  - /cgu : statut 200 ;
  - /confidentialite : statut 200.

## Fonctions principales présentes

### Talent

- Connexion e-mail.
- Connexion Google.
- Mot de passe oublié.
- Profil talent.
- CV et analyse IA.
- Lettre de motivation IA.
- Liste des offres.
- Candidature.
- Suivi des candidatures.
- Messagerie.
- Documents personnels.
- Documents demandés par entreprise.
- Confirmation avant envoi de document demandé.

### Entreprise

- Connexion e-mail.
- Connexion Google.
- Mot de passe oublié.
- Vérification SIRET.
- Profil entreprise.
- Création d'offre.
- Aide IA pour offres.
- Suivi des candidatures.
- Statuts candidat.
- Messagerie.
- Demande de documents.
- Suppression d'une demande de document.
- Documents partagés avec talent accepté.
- Abonnement Stripe.
- Portail Stripe.
- Factures téléchargeables.

### Abonnements

- Starter : limite d'annonce active testée côté utilisateur.
- Boost : formule disponible.
- Premium Intérim : formule disponible.
- Essai gratuit : limité à un choix par compte entreprise.
- Prix affichés en HT.
- Paiement sécurisé via Stripe.

## Sécurité déjà en place

- Authentification Supabase.
- Règles d'accès en base de données.
- Séparation talent/entreprise.
- Documents stockés dans un bucket privé.
- Liens temporaires pour l'ouverture des fichiers.
- Journalisation des accès documents.
- Chiffrement applicatif prévu pour les nouveaux documents sensibles.
- Fonction de nettoyage automatique des documents expirés.
- Secrets côté serveur.
- Paiements côté Stripe.
- Pages légales et politique de confidentialité publiées.

## Points encore à tester manuellement

- Un talent ne doit pas pouvoir ouvrir le document d'un autre talent.
- Une entreprise non liée ne doit pas pouvoir ouvrir un dossier candidat.
- Un compte Starter ne doit pas pouvoir publier plus d'une annonce active.
- Les questions de présélection doivent être visibles côté talent lors d'une candidature.
- Le portail Stripe doit permettre la modification ou la résiliation selon les paramètres Stripe.
- Les e-mails doivent arriver correctement sur Gmail et Outlook.
- Les rappels d'inactivité doivent être testés avec le job planifié.

## Risques restants

- Validation RGPD non encore faite par un professionnel.
- DPA des sous-traitants à récupérer et archiver.
- SPF/DKIM/DMARC à vérifier pour les e-mails.
- Mobile Expo pas encore stabilisé.
- Test de charge non encore réalisé.
- Revue externe de sécurité recommandée avant commercialisation large.

## Recommandation

Le site est prêt pour une démonstration encadrée et des tests métier. Avant vente large, il faut finaliser les contrôles RGPD, e-mails, sous-traitants, tests d'accès croisés et test métier complet.
