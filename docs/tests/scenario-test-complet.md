# Scénario de test complet - Spotted Talent

Date de mise à jour : 26 juillet 2026

Objectif : tester le parcours complet comme un vrai client, sans connaissances techniques.

## Comptes de test nécessaires

- 1 compte talent test.
- 1 compte entreprise test.
- 1 carte Stripe test si environnement test.
- 1 adresse e-mail accessible pour vérifier les messages.

## Parcours 1 - Talent

1. Aller sur https://www.spottedtalent.fr/talent
2. Créer un compte talent.
3. Vérifier que le lien CGU et Confidentialité est visible à la création.
4. Compléter le profil : nom, poste, secteur, localisation, compétences.
5. Ajouter un CV.
6. Lancer l'analyse IA du CV.
7. Générer une lettre de motivation.
8. Aller dans les offres.
9. Vérifier que les offres affichent correctement :
   - titre ;
   - entreprise ;
   - contrat ;
   - secteur ;
   - localisation ;
   - texte sans caractères cassés.
10. Postuler à une offre.
11. Vérifier que la candidature apparaît dans "Mes candidatures".

Résultat attendu :
- le compte se crée ;
- les textes sont propres ;
- l'IA répond ;
- la candidature est visible.

## Parcours 2 - Entreprise

1. Aller sur https://www.spottedtalent.fr/entreprise
2. Créer un compte entreprise.
3. Saisir un SIRET valide.
4. Vérifier que le nom et l'adresse remontent correctement.
5. Vérifier que le SIRET est protégé après validation.
6. Choisir une formule avec paiement sécurisé.
7. Vérifier que Stripe demande le moyen de paiement.
8. Revenir sur le dashboard.
9. Créer une offre.
10. Vérifier la limite selon abonnement :
    - Starter : 1 annonce active ;
    - Boost : jusqu'à 5 annonces actives ;
    - Premium : à valider selon règle produit.

Résultat attendu :
- entreprise vérifiée ;
- abonnement relié ;
- offre créée ;
- limite respectée.

## Parcours 3 - Candidature et suivi

1. Depuis le compte talent, postuler à l'offre.
2. Depuis le compte entreprise, ouvrir "Candidatures reçues".
3. Vérifier que le nom du talent, l'e-mail et l'offre sont visibles.
4. Cliquer sur "Voir le profil complet".
5. Changer le statut en entretien.
6. Changer le statut en accepté.
7. Vérifier que le dossier partagé apparaît.

Résultat attendu :
- statut mis à jour ;
- talent voit le changement ;
- dossier documents activé après acceptation.

## Parcours 4 - Documents demandés

1. Depuis le compte entreprise, ouvrir le dossier candidat accepté.
2. Choisir un document à demander.
3. Cliquer sur "Valider".
4. Vérifier que la demande apparaît dans "En attente du candidat".
5. Supprimer une demande pour vérifier que le bouton fonctionne.
6. Recréer une demande.
7. Depuis le compte talent, aller dans Documents.
8. Choisir un fichier.
9. Vérifier que le fichier n'est pas envoyé immédiatement.
10. Cliquer sur la confirmation "Envoyer le document".
11. Depuis l'entreprise, ouvrir le document reçu.

Résultat attendu :
- pas d'envoi accidentel ;
- suppression de demande possible côté entreprise ;
- ouverture du document possible uniquement par les comptes concernés.

## Parcours 5 - Sécurité documents

Test à faire avec deux comptes différents :

1. Compte talent A envoie un document.
2. Compte talent B essaie d'ouvrir le même document.
3. Compte entreprise non liée essaie d'ouvrir le document.
4. Compte entreprise liée ouvre le document.

Résultat attendu :
- talent A peut ouvrir ;
- entreprise liée peut ouvrir ;
- talent B ne peut pas ouvrir ;
- entreprise non liée ne peut pas ouvrir.

## Parcours 6 - Abonnement et factures

1. Depuis l'entreprise, ouvrir l'espace abonnement.
2. Cliquer sur "Gérer la carte et l'abonnement".
3. Vérifier que le portail Stripe s'ouvre.
4. Télécharger une facture si elle existe.
5. Tester changement de formule.
6. Tester ajout de moyen de paiement.

Résultat attendu :
- portail Stripe accessible ;
- facture téléchargeable ;
- changement ou gestion selon configuration Stripe.

## Parcours 7 - E-mails

1. Créer un compte.
2. Tester mot de passe oublié.
3. Tester confirmation paiement.
4. Tester rappel inactivité lorsque le job est configuré.
5. Vérifier réception Gmail et Outlook.

Résultat attendu :
- e-mails reçus ;
- pas de spam si SPF/DKIM/DMARC correctement configurés.

## Parcours 8 - Pages légales

1. Ouvrir https://www.spottedtalent.fr/cgu
2. Ouvrir https://www.spottedtalent.fr/confidentialite
3. Vérifier que les liens sont dans le footer.
4. Vérifier les pages sur mobile.

Résultat attendu :
- pages accessibles ;
- texte lisible ;
- pas de caractères cassés.

## Blocages à noter pendant les tests

| Date | Parcours | Problème vu | Gravité | Correction prévue | Statut |
| --- | --- | --- | --- | --- | --- |
| À compléter | À compléter | À compléter | Faible/Moyenne/Forte | À compléter | À faire |
