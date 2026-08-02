# Procédure interne - Incident ou fuite de données

Date de mise à jour : 26 juillet 2026

Cette procédure décrit quoi faire si Spotted Talent détecte une fuite de données, une perte de confidentialité, une suppression accidentelle, un accès non autorisé ou une indisponibilité importante touchant des données personnelles.

Références CNIL :
- Notifier une violation de données personnelles : https://www.cnil.fr/fr/services-en-ligne/notifier-une-violation-de-donnees-personnelles
- Violations de données personnelles, règles à suivre : https://www.cnil.fr/fr/violations-de-donnees-personnelles-les-regles-suivre

## 1. Détection

Déclencheurs possibles :
- utilisateur qui signale un accès anormal ;
- document ouvert par une personne non concernée ;
- alerte Supabase, Vercel, Stripe, Resend ou Groq ;
- clé API exposée ;
- compte administrateur compromis ;
- fichier supprimé ou rendu public par erreur ;
- logs anormaux.

## 2. Actions immédiates

À faire dès la découverte :

1. Noter la date et l'heure de constatation.
2. Identifier la fonctionnalité concernée : compte, document, paiement, e-mail, IA, base de données.
3. Bloquer l'accès suspect : désactiver compte, révoquer clé, couper webhook ou fonction si nécessaire.
4. Préserver les preuves : logs, captures, ID utilisateur, chemin document, événement Vercel/Supabase.
5. Ne pas supprimer les preuves avant analyse.

## 3. Analyse du risque

Questions à se poser :
- Quelles données sont concernées ?
- Combien d'utilisateurs sont concernés ?
- Les données sont-elles sensibles : pièce d'identité, RIB, carte vitale, CV, messages ?
- Les données étaient-elles chiffrées ou protégées par lien temporaire ?
- Quelqu'un d'extérieur a-t-il pu lire, télécharger ou modifier les données ?
- Le risque pour la personne est-il faible, moyen ou élevé ?

## 4. Notification CNIL

Si l'incident présente un risque pour les droits et libertés des personnes, il faut notifier la CNIL dans les meilleurs délais, si possible dans les 72 heures après constatation.

Si le délai de 72 heures est dépassé, il faut expliquer le retard.

Informations à préparer :
- nature de l'incident ;
- catégories de données concernées ;
- nombre approximatif de personnes ;
- conséquences possibles ;
- mesures prises ;
- contact responsable.

## 5. Information des utilisateurs

Si le risque est élevé pour les utilisateurs, les personnes concernées doivent être informées clairement.

Le message doit dire :
- ce qui s'est passé ;
- quelles données sont concernées ;
- quelles actions ont été prises ;
- quoi faire côté utilisateur ;
- comment contacter Spotted Talent.

## 6. Correction technique

Actions possibles :
- corriger une règle d'accès ;
- changer une clé API ;
- renforcer une Edge Function ;
- supprimer un lien public ;
- désactiver une fonction temporairement ;
- forcer la reconnexion ;
- ajouter un log ou une alerte ;
- revoir les droits administrateur.

## 7. Registre interne des incidents

Chaque incident doit être noté dans un registre interne :

| Date | Incident | Données concernées | Nombre d'utilisateurs | Risque | CNIL notifiée | Utilisateurs notifiés | Mesures prises | Responsable |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| À compléter | À compléter | À compléter | À compléter | À compléter | Oui/Non | Oui/Non | À compléter | À compléter |

## 8. Après incident

Après correction :
- vérifier que l'incident ne se reproduit plus ;
- tester les accès ;
- documenter la leçon apprise ;
- mettre à jour les CGU, la politique de confidentialité ou les procédures si nécessaire ;
- faire relire par un professionnel si l'incident touche des données sensibles.
