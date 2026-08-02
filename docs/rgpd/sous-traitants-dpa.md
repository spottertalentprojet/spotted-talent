# Sous-traitants et contrats DPA - Spotted Talent

Date de mise à jour : 26 juillet 2026

Objectif : garder une liste claire des prestataires qui peuvent traiter des données personnelles pour Spotted Talent, vérifier leurs garanties, et préparer la validation RGPD avant commercialisation.

Références utiles :
- CNIL, travailler avec un sous-traitant : https://www.cnil.fr/fr/sous-traitant
- CNIL, exemple de clauses de sous-traitance : https://www.cnil.fr/fr/sous-traitance-exemple-de-clauses

## Tableau de suivi

| Prestataire | Usage dans Spotted Talent | Données possibles | Lien officiel DPA / confidentialité | Action à faire |
| --- | --- | --- | --- | --- |
| Supabase | Authentification, base de données, stockage documents, fonctions serveur | comptes, profils, candidatures, messages, documents, logs | https://supabase.com/legal/dpa | Télécharger ou demander le DPA depuis le dashboard Supabase, confirmer région UE Stockholm pour la base |
| Vercel | Hébergement du site web | données techniques, logs d'accès, contenu statique | https://vercel.com/legal/dpa | Vérifier si le DPA est disponible selon le plan utilisé et conserver une copie |
| Stripe | Paiements, abonnements, factures, portail client | entreprise, e-mail, moyen de paiement, facture, adresse de facturation | https://stripe.com/legal/dpa | Vérifier le DPA Stripe et les paramètres de facturation France |
| Resend | E-mails transactionnels | e-mail, nom, contenu des notifications | https://resend.com/legal/dpa | Vérifier DPA, SPF/DKIM/DMARC, domaine d'envoi |
| Groq | Intelligence artificielle | textes soumis pour analyse ou génération | https://console.groq.com/docs/legal/customer-data-processing-addendum | Vérifier DPA, conditions de conservation, éviter documents sensibles non nécessaires |
| Google | Connexion OAuth | e-mail, profil Google de base | https://policies.google.com/privacy | Vérifier branding OAuth, consent screen, URI autorisées |

## Points à contrôler pour chaque prestataire

- Le prestataire fournit-il un DPA ou contrat de traitement des données ?
- Le DPA couvre-t-il le RGPD ?
- Les données peuvent-elles sortir de l'Union européenne ?
- Des clauses contractuelles types ou garanties équivalentes sont-elles prévues ?
- Existe-t-il une liste de sous-traitants ultérieurs ?
- Existe-t-il une procédure de notification en cas d'incident ?
- Les données sont-elles supprimables à la fin du contrat ?
- Les paramètres de sécurité du compte sont-ils activés : 2FA, accès limité, secrets protégés ?

## Décisions actuelles recommandées

- Ne jamais stocker les numéros complets de carte bancaire dans Spotted Talent : Stripe doit rester responsable de la carte.
- Garder les documents utilisateurs dans un stockage privé.
- Limiter l'envoi vers l'IA aux textes nécessaires.
- Garder les secrets dans Supabase Edge Function Secrets et Vercel Environment Variables, pas dans GitHub.
- Conserver une copie PDF ou capture de chaque DPA accepté.

## Actions manuelles restantes

- Télécharger ou accepter le DPA Supabase depuis le compte Supabase.
- Vérifier le DPA Vercel selon le plan utilisé.
- Vérifier le DPA Stripe dans le compte Stripe.
- Vérifier le DPA Resend et configurer SPF, DKIM, DMARC.
- Vérifier le DPA Groq et sa politique de conservation des prompts.
- Garder une preuve de ces vérifications dans un dossier interne.
