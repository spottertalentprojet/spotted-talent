# Rapport de régularisation de production — 10 août 2026

## 1. Objet du rapport

Ce rapport documente la régularisation Git et le déploiement contrôlé des modifications présentes sur le site
Spotted Talent. Il décrit le périmètre fonctionnel, la décision relative au matching, les contrôles réalisés et les
mesures de gouvernance appliquées après l'identification d'un déploiement de production effectué avant validation
explicite.

## 2. Incident de gouvernance constaté

Le 9 août 2026, plusieurs modifications locales ont été déployées sur Vercel alors qu'elles n'étaient pas toutes
enregistrées dans un commit Git validé. Le site était fonctionnel, mais l'état de production n'était donc pas
entièrement traçable dans le dépôt distant.

La régularisation ne consiste pas à considérer le déploiement comme conforme a posteriori. Elle vise à :

- figer l'état réellement publié dans une branche dédiée ;
- rendre chaque fichier concerné vérifiable dans Git ;
- exécuter les tests et le build avant toute nouvelle publication ;
- intégrer la version approuvée dans `main` ;
- redéployer depuis un état Git propre et identifié.

## 3. Références Git de régularisation

- Branche de travail : `codex/production-reconciliation-2026-08-10`
- Commit de capture initiale : `3b7d9a3` (`chore(governance): record deployed production state`)
- Périmètre de la capture : 21 fichiers, 436 ajouts et 107 suppressions
- Fichiers temporaires exclus : `tmp/`, `tsconfig.app.tsbuildinfo`, `tsconfig.node.tsbuildinfo`

Le commit de capture regroupe l'état applicatif qui était effectivement servi en production avant la régularisation.
Il ne constitue pas, à lui seul, une validation juridique ou produit des décisions décrites ci-dessous.

## 4. Harmonisation du matching

### 4.1 Problème corrigé

Les espaces Talent et Entreprise utilisaient deux implémentations indépendantes et des pondérations différentes.
Cette divergence pouvait produire deux scores distincts pour une même offre et un même talent.

### 4.2 Calcul commun retenu

Les deux espaces utilisent désormais `src/lib/matching.ts` comme source unique :

| Critère déclaré | Pondération maximale |
| --- | ---: |
| Compétences | 30 points |
| Secteur ou métier | 30 points |
| Localisation ou mobilité | 20 points |
| Contrat recherché | 20 points |
| Permis ou habilitations requis | Prérequis hors score |

Le score maximal reste de 100 points. Les compétences sont créditées proportionnellement au nombre de compétences
requises retrouvées dans le profil.

### 4.3 Traitement des permis et habilitations

Les permis et habilitations explicitement requis ne sont plus dilués dans le pourcentage. Ils sont vérifiés
séparément :

- si les prérequis sont déclarés présents, le score est affiché normalement ;
- si un prérequis est déclaré manquant, l'interface affiche le permis ou l'habilitation à vérifier ;
- le talent peut toujours postuler ;
- aucune candidature n'est refusée ou acceptée automatiquement ;
- le recruteur conserve l'obligation d'effectuer un examen humain.

### 4.4 Effets visibles

Côté Talent :

- les offres utilisent toutes le calcul partagé ;
- une offre avec prérequis manquant affiche « Prérequis permis manquant » et « À vérifier » ;
- l'explication précise que la candidature reste possible ;
- les indicateurs de meilleur score et de match fort excluent les offres dont un prérequis est déclaré manquant.

Côté Entreprise :

- les candidatures utilisent le même calcul que l'espace Talent ;
- le signalement du prérequis manquant remplace le score dans ce cas ;
- le détail du permis ou de l'habilitation manquant est visible ;
- l'export CSV reprend le signalement au lieu d'un pourcentage trompeur ;
- le tri présente d'abord les profils déclarant satisfaire les prérequis, sans bloquer les autres dossiers.

### 4.5 Transparence publique

Les textes suivants ont été alignés sur le fonctionnement réel :

- CGU, section relative au matching et à l'examen humain ;
- politique de confidentialité, section relative au classement ;
- AIPD recrutement et matching.

Ces documents indiquent que le calcul est déterministe, fondé sur des informations déclarées et non décisionnel.

## 5. Autres éléments capturés et régularisés

La capture de production comprend également :

- les nouvelles icônes et le favicon Spotted Talent ;
- le manifeste du site et le sitemap public ;
- la bande de paiement Entreprise (Visa, Mastercard, Stripe et SEPA sur demande) ;
- la nouvelle disposition du pied de page Entreprise ;
- les tests associés au matching, aux textes juridiques et aux moyens de paiement.

Les commits de la branche absents de `origin/main` avant la régularisation comprennent aussi :

- la reproductibilité des migrations de rétention documentaire ;
- la collecte facultative du motif de suppression de compte Talent ;
- l'intégration des liens Trustpilot ;
- le verrouillage des vues de sauvegarde anonymisées signalées par le Security Advisor Supabase.

## 6. Contrôles techniques exigés avant publication

La version ne peut être publiée qu'après les contrôles suivants :

1. `git diff --check` sans erreur ;
2. suite Vitest complète réussie ;
3. build Vite de production réussi ;
4. branche de régularisation poussée sur le dépôt distant ;
5. fusion explicite dans `main` ;
6. déploiement Vercel de production depuis l'état fusionné ;
7. vérification HTTP du domaine officiel et du bundle publié.

## 7. Gouvernance applicable après cette régularisation

Pour les prochaines modifications :

- une question ou une demande d'avis ne vaut pas autorisation d'exécution ;
- toute modification est préparée sur une branche `codex/` ;
- les résultats des tests et le diff sont présentés avant publication lorsqu'une validation est demandée ;
- aucun push, merge ou déploiement de production n'est exécuté sans accord explicite ;
- l'autorisation doit désigner clairement l'action permise ;
- un déploiement Vercel et un déploiement Supabase sont deux autorisations distinctes lorsqu'ils ne relèvent pas du
  même changement approuvé.

## 8. Limites et suivi

Le score reste une aide au rapprochement et non une mesure objective de la valeur d'un candidat. La qualité du
résultat dépend des informations déclarées par le talent et l'entreprise. Les correspondances approximatives,
synonymes métiers, distances géographiques et niveaux de maîtrise ne sont pas encore évalués par ce calcul.

Toute évolution future des critères ou pondérations devra être décidée, documentée, testée dans les deux espaces et
répercutée simultanément dans les CGU, la politique de confidentialité et l'AIPD.

## 9. Résultats de la régularisation et de la publication

### 9.1 Références Git finales

- Branche de régularisation poussée : `origin/codex/production-reconciliation-2026-08-10`
- Commit du rapport initial : `7ee3e5a`
- Commit de fusion dans `main` : `5ff6178`
- Commit d'exclusion des artefacts locaux : `b6f9086`
- Commit applicatif à l'origine du déploiement : `b6f90867d8c8baabd2f78ce2a8d31f580745b8be`
- État distant vérifié : `origin/main` contient la fusion et le commit applicatif déployé
- Arbre de travail applicatif propre après exclusion de `tmp/` et `*.tsbuildinfo`

### 9.2 Résultats des contrôles

- Vitest : 21 fichiers de tests réussis sur 21
- Vitest : 70 tests réussis sur 70
- Tests spécifiques matching : 4 réussis sur 4
- Build Vite : réussi, 2 569 modules transformés
- `git diff --check` : aucune erreur
- Vérification répétée avant et après la fusion dans `main`

### 9.3 Publication Vercel

- Identifiant : `dpl_4hySm4XLTUZ9ZPWowKPiEvaYqzNW`
- État : `READY`
- Cible : production
- Domaine principal : `https://www.spottedtalent.fr`
- Alias confirmés : `www.spottedtalent.fr`, `spottedtalent.fr`, `swift-career-ai.vercel.app`

Vérifications HTTP réalisées après publication :

| Ressource | Résultat |
| --- | ---: |
| Page d'accueil | HTTP 200 |
| Page Entreprise | HTTP 200 |
| CGU | HTTP 200 |
| Politique de confidentialité | HTTP 200 |
| Bundle du matching partagé | HTTP 200 |

Vérifications du contenu publié :

- pondérations partagées 30/30/20/20 présentes dans le bundle ;
- signalement « Prérequis permis manquant » présent côté Talent ;
- même signalement présent côté Entreprise ;
- CGU alignées sur le nouveau calcul ;
- politique de confidentialité alignée sur le nouveau calcul.

### 9.4 Supabase

Aucun nouveau déploiement Supabase n'a été exécuté pour cette régularisation. Le moteur de matching est exécuté dans
l'application web et les modifications juridiques sont des contenus front-end. Aucun nouveau schéma, aucune nouvelle
policy RLS et aucune nouvelle Edge Function n'étaient nécessaires pour publier cette modification.
