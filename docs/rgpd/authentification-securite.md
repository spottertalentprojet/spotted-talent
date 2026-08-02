# Spotted Talent - Authentification et securite des comptes

Derniere mise a jour : 26 juillet 2026.

## Objectif

Renforcer la protection juridique et technique des comptes Talent et Entreprise avant commercialisation.

## Mesures mises en place cote application

- Confirmation e-mail prise en compte a la creation de compte.
- Blocage applicatif des comptes non confirmes.
- Message clair quand un utilisateur tente d'entrer sans avoir confirme son e-mail.
- Panneau "Securite du compte" dans les profils Talent et Entreprise.
- Activation possible de la double authentification par application TOTP : Google Authenticator, Microsoft Authenticator ou Authy.
- Affichage d'un QR code et d'un code manuel pour enroler l'application d'authentification.
- Verification du code a 6 chiffres avant activation de la double authentification.
- Challenge MFA obligatoire a la connexion lorsque le compte possede un facteur TOTP verifie.
- Possibilite de desactiver un facteur MFA depuis le profil.

## Reglages Supabase a verifier manuellement

1. Aller dans Supabase > Authentication > Providers > Email.
2. Activer le fournisseur e-mail.
3. Activer "Confirm email" pour obliger la confirmation e-mail avant premiere connexion.
4. Aller dans Authentication > URL Configuration.
5. Mettre le Site URL sur `https://www.spottedtalent.fr`.
6. Ajouter les Redirect URLs utiles :
   - `https://www.spottedtalent.fr/**`
   - `http://localhost:8080/**` uniquement pour les tests locaux.
7. Aller dans Authentication > Multi-Factor.
8. Verifier que TOTP / App Authenticator est active.
9. Personnaliser le template e-mail de confirmation en francais.

## Points a noter

- La double authentification TOTP est une mesure forte, mais elle depend de l'activation du facteur par l'utilisateur.
- Pour une obligation stricte pour tous les comptes entreprise, il faudra ajouter une regle produit : acces bloque tant que la 2FA n'est pas activee.
- Les reglages Supabase restent indispensables : le code applicatif ne remplace pas l'activation de "Confirm email" dans le tableau de bord Supabase.
