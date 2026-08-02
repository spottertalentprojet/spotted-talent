# Registre RGPD interne - Spotted Talent

Date de mise à jour : 26 juillet 2026

Ce document sert de registre interne des traitements de données personnelles pour Spotted Talent. Il est préparé pour faciliter une relecture par un professionnel RGPD, DPO ou juriste avant commercialisation.

Références utiles :
- CNIL, registre des activités de traitement : https://www.cnil.fr/fr/RGPD-le-registre-des-activites-de-traitement
- CNIL, comprendre le RGPD : https://www.cnil.fr/fr/comprendre-le-rgpd
- CNIL, guide sécurité des données personnelles 2024 : https://www.cnil.fr/fr/guide-de-la-securite-des-donnees-personnelles-nouvelle-edition-2024

## Responsable du traitement

Responsable : Spotted Talent  
Site : https://www.spottedtalent.fr  
Contact RGPD : contact@spottedtalent.fr  
Adresse indiquée sur le site : La Ravoire, 73490, France

## Traitement 1 - Gestion des comptes utilisateurs

Personnes concernées :
- talents ;
- entreprises ;
- administrateur du service.

Données traitées :
- nom, prénom, e-mail ;
- rôle utilisateur ;
- identifiant utilisateur ;
- date de création ;
- dernière connexion ;
- état d'inactivité ou de suspension.

Finalités :
- créer et sécuriser les comptes ;
- permettre la connexion par e-mail ou Google ;
- appliquer les droits d'accès selon le rôle ;
- détecter les comptes inactifs ;
- envoyer les rappels de sécurité liés à l'inactivité.

Base légale à valider :
- exécution du service ;
- intérêt légitime de sécurité.

Durée de conservation :
- pendant l'utilisation du service ;
- suspension possible après 30 jours sans connexion ;
- suppression ou anonymisation à définir pour les comptes durablement inactifs.

Mesures de sécurité :
- authentification Supabase ;
- règles d'accès en base ;
- suivi de dernière activité ;
- rappels par e-mail avant suspension.

## Traitement 2 - Profil talent

Personnes concernées :
- candidats et talents inscrits.

Données traitées :
- identité ;
- e-mail ;
- téléphone si renseigné ;
- adresse ou localisation si renseignée ;
- poste recherché ;
- secteur ;
- contrat recherché ;
- compétences ;
- présentation ;
- CV ;
- lettre de motivation ;
- analyse IA du CV si l'utilisateur l'utilise.

Finalités :
- présenter le profil du talent ;
- permettre la candidature ;
- aider le talent à améliorer son CV ;
- permettre aux entreprises liées à une candidature d'évaluer le profil.

Base légale à valider :
- exécution du service ;
- consentement ou action volontaire pour l'analyse IA.

Durée de conservation :
- pendant l'activité du compte ;
- suppression ou anonymisation sur demande lorsque possible ;
- conservation limitée des documents sensibles selon leur nature.

Mesures de sécurité :
- accès limité au talent et aux entreprises concernées par une candidature ;
- stockage privé des documents ;
- liens temporaires pour consulter les fichiers ;
- nettoyage d'affichage des textes stockés pour éviter les erreurs de caractères.

## Traitement 3 - Profil entreprise et vérification SIRET

Personnes concernées :
- recruteurs ;
- représentants d'entreprise ;
- entreprises inscrites.

Données traitées :
- nom de l'entreprise ;
- SIRET ;
- adresse ;
- ville ;
- secteur ;
- taille ou informations publiques si disponibles ;
- téléphone et informations de contact si renseignés ;
- logo ;
- statut de vérification SIRET.

Finalités :
- identifier l'entreprise ;
- limiter les faux comptes ;
- sécuriser l'accès aux fonctions payantes ;
- afficher une entreprise fiable aux talents.

Base légale à valider :
- exécution du service ;
- intérêt légitime de sécurité et de lutte contre la fraude.

Durée de conservation :
- pendant l'utilisation du service ;
- facturation conservée selon les obligations légales ;
- données non nécessaires à supprimer ou anonymiser en cas de fermeture du compte.

Mesures de sécurité :
- SIRET verrouillé après vérification ;
- paiement et abonnement reliés au compte entreprise ;
- limitation d'essai gratuit à un seul choix par compte entreprise.

## Traitement 4 - Offres d'emploi

Personnes concernées :
- entreprises ;
- talents consultant ou postulant aux offres.

Données traitées :
- titre de l'offre ;
- description ;
- contrat ;
- secteur ;
- localisation ;
- salaire si indiqué ;
- questions de présélection ;
- options payantes ou badges si disponibles.

Finalités :
- publier des offres ;
- permettre aux talents de postuler ;
- filtrer et classer les offres ;
- aider à la rédaction par IA si l'utilisateur le demande.

Base légale à valider :
- exécution du service ;
- intérêt légitime d'amélioration du service.

Durée de conservation :
- pendant la publication de l'offre ;
- archivage ou suppression à définir après clôture.

Mesures de sécurité :
- publication réservée aux entreprises autorisées ;
- limites serveur selon l'abonnement ;
- nettoyage des textes affichés.

## Traitement 5 - Candidatures et messagerie

Personnes concernées :
- talents ;
- entreprises.

Données traitées :
- offre concernée ;
- talent concerné ;
- entreprise concernée ;
- statut de candidature ;
- messages ;
- réponses aux questions de présélection ;
- historique de suivi.

Finalités :
- suivre une candidature ;
- permettre l'échange entre talent et entreprise ;
- gérer les statuts : envoyée, entretien, acceptée, refusée ;
- déclencher les dossiers partagés après acceptation.

Base légale à valider :
- exécution du service ;
- intérêt légitime de suivi et de preuve.

Durée de conservation :
- pendant le suivi du recrutement ;
- suppression ou anonymisation à définir après fin de recrutement ;
- suppression sur demande si aucune obligation ne s'y oppose.

Mesures de sécurité :
- accès limité au talent et à l'entreprise concernés ;
- séparation des rôles ;
- pas d'accès public.

## Traitement 6 - Documents partagés et documents sensibles

Personnes concernées :
- talents ;
- entreprises.

Données traitées :
- CV ;
- lettre de motivation ;
- pièce d'identité ;
- RIB ;
- permis ;
- carte vitale ou document administratif demandé ;
- contrats, paies, documents d'intérim ;
- nom de fichier ;
- chemin de stockage ;
- logs d'ouverture et de téléchargement.

Finalités :
- transmettre les documents nécessaires à un dossier accepté ;
- séparer les documents personnels des dossiers partagés ;
- permettre à l'entreprise de demander uniquement les pièces utiles ;
- garder une trace d'accès aux documents sensibles.

Base légale à valider :
- exécution du service ;
- obligation légale ou intérêt légitime selon le document ;
- minimisation stricte pour les pièces sensibles.

Durée de conservation :
- documents sensibles demandés : suppression automatique possible après 30 jours ;
- documents personnels : conservés tant que le compte est actif, sauf demande de suppression ;
- documents de facturation ou obligations légales : durée légale applicable.

Mesures de sécurité :
- bucket Supabase privé ;
- liens signés temporaires ;
- journalisation des accès ;
- chiffrement applicatif des nouveaux documents sensibles lorsque disponible ;
- nettoyage automatique par fonction serveur via Storage API ;
- suppression directe des tables de stockage interdite.

Point à valider :
- définir précisément quels documents peuvent être demandés et à quel moment, surtout pièce d'identité, RIB et carte vitale.

## Traitement 7 - Paiements, abonnements et factures

Personnes concernées :
- entreprises clientes ;
- représentants d'entreprise.

Données traitées :
- formule choisie ;
- statut d'abonnement ;
- identifiant client Stripe ;
- identifiant abonnement Stripe ;
- historique de facturation ;
- factures ;
- moyen de paiement géré par Stripe.

Finalités :
- gérer les abonnements ;
- appliquer les limites Starter, Boost et Premium ;
- gérer les essais gratuits ;
- permettre l'accès au portail client Stripe ;
- générer et conserver les factures.

Base légale à valider :
- exécution du contrat ;
- obligation légale de facturation.

Durée de conservation :
- pendant la relation commerciale ;
- factures conservées selon les obligations comptables et fiscales applicables.

Mesures de sécurité :
- paiement géré par Stripe ;
- Spotted Talent ne stocke pas le numéro complet de carte bancaire ;
- webhooks Stripe côté serveur ;
- secrets Stripe stockés dans Supabase Edge Function Secrets.

## Traitement 8 - E-mails transactionnels

Personnes concernées :
- talents ;
- entreprises.

Données traitées :
- e-mail ;
- nom d'affichage ;
- type d'événement : confirmation, rappel, paiement, notification utile.

Finalités :
- envoyer les confirmations utiles ;
- rappeler l'inactivité ;
- confirmer un paiement ou une facture ;
- notifier les événements importants.

Base légale à valider :
- exécution du service ;
- intérêt légitime de sécurité et de suivi.

Durée de conservation :
- selon les journaux techniques du prestataire e-mail ;
- contenu limité au strict nécessaire.

Mesures de sécurité :
- envoi via Resend ;
- secrets stockés côté serveur ;
- configuration SPF, DKIM et DMARC à vérifier sur le domaine.

## Traitement 9 - Intelligence artificielle

Personnes concernées :
- talents ;
- entreprises.

Données traitées :
- contenu de CV ou résumé fourni volontairement ;
- informations de profil utiles à l'analyse ;
- éléments d'une offre d'emploi ;
- demande de génération de lettre ou d'offre.

Finalités :
- analyser un CV ;
- proposer des conseils ;
- générer une lettre de motivation ;
- aider à rédiger une offre d'emploi.

Base légale à valider :
- action volontaire de l'utilisateur ;
- exécution du service ;
- information claire avant usage.

Durée de conservation :
- à vérifier dans les conditions du prestataire IA ;
- éviter d'envoyer des documents sensibles non nécessaires.

Mesures de sécurité :
- fonction serveur ;
- clé API côté serveur ;
- filtrage recommandé pour éviter l'envoi de documents administratifs sensibles à l'IA.

## Traitement 10 - Logs de sécurité et incidents

Personnes concernées :
- utilisateurs du site ;
- administrateur.

Données traitées :
- journaux d'accès aux documents ;
- actions de suppression ;
- logs techniques d'erreur ;
- horodatage ;
- identifiants techniques.

Finalités :
- détecter les erreurs ;
- prouver l'accès à un document sensible ;
- enquêter sur un incident ;
- sécuriser le service.

Base légale à valider :
- intérêt légitime de sécurité ;
- obligation de documenter certains incidents.

Durée de conservation :
- durée limitée à définir selon le besoin de sécurité ;
- les logs doivent être revus et purgés lorsqu'ils ne sont plus nécessaires.

Mesures de sécurité :
- table de logs documentaires ;
- accès restreint ;
- procédure de violation de données.

## Points à faire valider

- Statut exact de Spotted Talent : responsable de traitement, sous-traitant, ou les deux selon les cas.
- Durées définitives de conservation par catégorie.
- Base légale exacte pour chaque traitement.
- Nécessité ou non d'un DPO selon le volume et la nature des données.
- Encadrement des documents sensibles et données pouvant relever d'une attention particulière.
- Contrats de sous-traitance et transferts hors UE.
- Processus opérationnel de réponse aux demandes RGPD.
