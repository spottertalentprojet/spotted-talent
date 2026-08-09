# Exploitation de la conservation documentaire

La fonction Edge `cleanup-expired-documents` est l'unique mécanisme qui supprime
les fichiers expirés du bucket privé `documents`. Elle s'exécute une fois par
jour et applique les deux règles suivantes :

- document envoyé par un talent : 7 jours après la première réception confirmée,
  ou 30 jours après l'envoi si personne ne le récupère ;
- document envoyé par une entreprise au talent : 90 jours après l'envoi.

La suppression porte sur l'objet Storage et sur les éléments de chiffrement. La
ligne de métadonnées, la demande et l'événement `document_supprimé` restent
présents pour la traçabilité.

## Activation dans Supabase après validation du merge

1. Déployer les migrations puis la fonction Edge, sans afficher les secrets :

   ```powershell
   npx.cmd --yes supabase@latest db push
   npx.cmd --yes supabase@latest functions deploy cleanup-expired-documents
   ```

2. Créer un secret aléatoire `RETENTION_JOB_SECRET` dans les secrets Edge.

3. Dans Supabase Vault, créer les secrets suivants :

   - `spotted_talent_retention_function_url` : URL complète de la fonction
     `cleanup-expired-documents` ;
   - `spotted_talent_retention_job_secret` : la même valeur que
     `RETENTION_JOB_SECRET`.

4. Si les secrets Vault ont été ajoutés après la migration, exécuter à nouveau
   uniquement le bloc de planification documenté dans la migration
   `20260809170000_document_retention_lifecycle.sql`, ou configurer un appel
   externe quotidien équivalent avec l'en-tête `x-retention-secret`.

5. Vérifier chaque jour le résultat de `cron.job_run_details` et les événements
   `document_supprimé` du journal d'accès.

Ne jamais placer la clé `service_role` ou le secret de rétention dans le code du
site ou dans une variable exposée par Vite.
