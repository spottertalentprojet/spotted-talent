# Checklist avant commercialisation - Spotted Talent

Date de mise à jour : 26 juillet 2026

Objectif : vérifier que le site est prêt pour des tests professionnels puis pour une ouverture commerciale.

## 1. Juridique et RGPD

- [x] Page Mentions légales & CGU créée et publiée.
- [x] Page Politique de confidentialité créée et publiée.
- [x] Données collectées expliquées.
- [x] Sous-traitants listés : Supabase, Vercel, Stripe, Resend, Groq, Google.
- [x] Droits RGPD expliqués : accès, rectification, suppression, opposition, portabilité.
- [x] Durées de conservation indiquées.
- [x] Procédure fuite de données préparée.
- [ ] Faire relire par un professionnel RGPD ou juriste.
- [ ] Valider les bases légales exactes pour chaque traitement.
- [ ] Valider les durées définitives de conservation.
- [ ] Télécharger ou accepter les DPA des sous-traitants.
- [ ] Décider si un DPO est nécessaire selon le volume réel de données.

## 2. Sécurité technique

- [x] Authentification Supabase active.
- [x] Connexion Google fonctionnelle.
- [x] Documents stockés dans un bucket privé.
- [x] Accès documents par liens temporaires.
- [x] Logs d'accès aux documents en place.
- [x] Nettoyage automatique des documents expirés via Edge Function.
- [x] Blocage des suppressions directes dans les tables Storage respecté.
- [x] Secrets stockés côté serveur.
- [x] Paiements Stripe gérés côté serveur.
- [x] Build et tests automatiques passent.
- [ ] Faire tester par une personne externe avec comptes talent et entreprise.
- [ ] Faire un test d'accès croisé : un compte ne doit jamais ouvrir le document d'un autre compte.
- [ ] Faire un test de montée en charge simple.
- [ ] Mettre en place une surveillance régulière des logs Supabase/Vercel.

## 3. Domaine, e-mails et image pro

- [x] Site officiel actif : https://www.spottedtalent.fr
- [x] Domaine affiché dans les pages légales.
- [x] E-mails transactionnels prévus avec Resend.
- [ ] Configurer SPF, DKIM et DMARC pour le domaine d'envoi.
- [ ] Tester réception e-mail sur Gmail, Outlook et mobile.
- [ ] Vérifier le nom affiché dans Google OAuth.
- [ ] Envisager plus tard un domaine personnalisé Supabase pour éviter l'URL technique Supabase dans certains flux OAuth.

## 4. Paiement et abonnement

- [x] Stripe Checkout actif.
- [x] Stripe Portal actif.
- [x] Factures téléchargeables côté entreprise.
- [x] Limite d'un essai gratuit par compte entreprise.
- [x] Limites d'annonces côté Starter testées.
- [x] Prix affichés en HT.
- [ ] Faire un test complet en mode production Stripe avant vraie vente.
- [ ] Vérifier les mentions de TVA, factures et obligations comptables.
- [ ] Vérifier les paramètres de résiliation/modification d'abonnement dans Stripe Portal.

## 5. Fonctionnel métier

- [x] Création de profil talent.
- [x] Création de profil entreprise.
- [x] Création d'offre avec IA.
- [x] Candidature talent.
- [x] Suivi des candidatures.
- [x] Messagerie.
- [x] Demande de documents par l'entreprise.
- [x] Validation avant envoi côté talent.
- [x] Suppression de demande de document côté entreprise.
- [x] Ouverture et téléchargement des documents.
- [ ] Faire tester par un recruteur non technique.
- [ ] Faire tester par un candidat non technique.
- [ ] Noter les blocages d'ergonomie avant commercialisation.

## 6. Mobile

- [ ] Reprendre Expo.
- [ ] Résoudre le problème réseau/QR code.
- [ ] Tester iPhone et Android.
- [ ] Prioriser mobile après stabilisation web.

## Décision recommandée

Le site peut être montré en démonstration encadrée, mais avant vente large il faut terminer :

1. validation RGPD ;
2. DPA sous-traitants ;
3. e-mails domaine ;
4. test métier complet avec comptes réels de test ;
5. test d'accès documents par comptes séparés.
