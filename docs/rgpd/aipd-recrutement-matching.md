# AIPD préparatoire — recrutement, matching et documents

Date de mise à jour : 9 août 2026
Statut : AIPD requise avant traitement de candidatures réelles en production ; analyse interne à finaliser et faire valider
Responsable métier : Yousri Frigui, entrepreneur individuel

## 1. Conclusion préliminaire

Une AIPD complète est requise avant le lancement commercial avec des candidatures réelles. La liste CNIL des
traitements soumis à AIPD vise les traitements facilitant le recrutement, notamment au moyen d'un algorithme de
sélection. Le traitement Spotted Talent combine en outre plusieurs critères de risque :

- évaluation et score de correspondance appliqués à des candidats ;
- contexte de recrutement pouvant influencer l’accès à un emploi ;
- documents professionnels et, dans certains cas, données hautement personnelles ;
- combinaison d’informations de profil, de candidature et d’offre ;
- fonctions d’intelligence artificielle utilisées pour analyser ou générer du contenu.

Le règlement (UE) 2024/1689 vise notamment, dans son annexe III, les systèmes d’IA destinés au recrutement, à la
présélection, au filtrage des candidatures ou à l’évaluation des candidats. Selon le calendrier européen actualisé en
juillet 2026, les obligations propres à ces systèmes à haut risque doivent s’appliquer à compter du 2 décembre 2027.
Les autres obligations déjà applicables et le RGPD restent à respecter. Le matching actuel de Spotted Talent est
déterministe et n’utilise pas de modèle d’IA ; il n’accepte, ne refuse et n’évalue pas
automatiquement une personne. Cette conclusion doit être revue et documentée avant toute modification du calcul ou
toute mise à disposition d’un résultat d’IA susceptible d’influencer matériellement une sélection.

Références :

- CNIL, analyse d’impact : https://www.cnil.fr/fr/ce-quil-faut-savoir-sur-lanalyse-dimpact-relative-la-protection-des-donnees-aipd
- CNIL, guide recrutement : https://www.cnil.fr/sites/default/files/atoms/files/guide_-_recrutement.pdf
- Règlement européen sur l’IA : https://eur-lex.europa.eu/eli/reg/2024/1689/oj
- Calendrier européen actualisé : https://digital-strategy.ec.europa.eu/en/policies/guidelines-ai-high-risk-systems

## 2. Périmètre

Traitements couverts :

- création du profil Talent ;
- publication et consultation des offres ;
- calcul du score de matching ;
- candidature et réponses de présélection ;
- messagerie liée à une candidature ;
- demande et partage de documents métier ;
- analyse de CV et génération de lettre ;
- aide à la rédaction d’une offre ;
- journaux d’accès et mesures de sécurité.

Hors périmètre actuel :

- paie et gestion complète du salarié ;
- décision de recrutement automatique ;
- reconnaissance biométrique ;
- publicité comportementale ;
- vente ou location de profils.

## 3. Fonctionnement du matching

Le score actuel est déterministe et n’utilise pas un modèle d’IA. Il additionne :

| Critère | Pondération maximale |
| --- | ---: |
| Compétences déclarées | 30 points |
| Secteur ou métier | 30 points |
| Localisation | 20 points |
| Type de contrat | 20 points |
| Permis ou habilitations explicitement requis | Prérequis hors score |

L’absence déclarée d’un permis ou d’une habilitation obligatoire est affichée comme un prérequis manquant. Elle
n’empêche pas le talent de postuler et ne déclenche aucun refus automatique. Le score chiffré est présenté lorsque
les prérequis déclarés sont satisfaits.

Garanties actuelles :

- aucune candidature n’est acceptée ou refusée automatiquement ;
- le recruteur conserve l’examen et la décision ;
- les critères sont publiés dans les CGU et la politique de confidentialité ;
- le score doit rester un indicateur et ne pas devenir l’unique motif d’une décision ;
- les critères ne doivent pas inclure de donnée sensible ou de caractéristique protégée.

## 4. Nécessité et proportionnalité

### Données nécessaires

- secteur, poste, contrat et compétences pour proposer des correspondances ;
- localisation volontaire, limitée à la zone utile au recrutement ;
- permis et habilitations uniquement lorsqu’ils conditionnent réellement le poste ;
- identité et contact pour créer le compte et suivre une candidature ;
- messages et statuts pour documenter le parcours demandé par les parties.

### Dossier administratif disponible après acceptation

Le dossier d’une candidature acceptée peut recevoir, sur demande prédéfinie et pour préparer une formalité d’embauche :

- une copie de pièce d’identité ;
- un RIB ;
- une attestation de droits à l’Assurance Maladie ;
- un justificatif de domicile lorsque la formalité le nécessite.

Le partage reste volontaire pour le talent, limité à l’entreprise partie à la candidature, journalisé et soumis aux
règles d’expiration du coffre documentaire.

### Données volontairement exclues des demandes génériques

- copie de Carte Vitale ;
- photo d’identité générale ;
- copie de casier judiciaire ;
- données de santé détaillées ;
- catégorie libre « autre document administratif ».

Un besoin exceptionnel imposé par un texte ou une profession réglementée doit faire l’objet d’une analyse et d’un
traitement séparés avant toute collecte.

## 5. Principaux risques et mesures

| Risque | Impact possible | Mesures existantes | Reste à faire |
| --- | --- | --- | --- |
| Survalorisation du score | exclusion injustifiée d’un candidat | score indicatif, aucune décision automatique | former les recruteurs et surveiller les usages |
| Donnée de profil incorrecte | mauvais classement | profil modifiable par le talent | ajouter un canal explicite de contestation du score |
| Discrimination indirecte | accès inéquitable aux offres | critères limités au poste | tester périodiquement les résultats et écarts |
| Accès non autorisé à un document | vol d’identité ou préjudice professionnel | stockage privé, liens temporaires, RLS, logs | audit externe et revue périodique des accès |
| Demande excessive de pièce | collecte disproportionnée | liste réduite et blocage serveur | vérifier les demandes et sanctionner les abus |
| Transmission excessive à l’IA | divulgation de données | déclenchement volontaire, traitement serveur | confirmer la rétention Groq et filtrer les entrées |
| Conservation excessive | exposition prolongée | échéance de 30 jours pour les documents protégés | automatiser les autres durées et vérifier les purges |
| Compte compromis | fuite de candidatures | e-mail confirmé, MFA obligatoire entreprise avant les espaces privés, alertes | contrôler périodiquement le parcours et les méthodes de récupération |

## 6. Mesures AI Act à maintenir avant toute évolution à risque

- documenter la destination exacte de chaque fonction et la justification de sa classification ;
- conserver la description des données d’entrée, des règles, des limites et des performances attendues ;
- tester les écarts de résultat et les risques de discrimination sur des cas représentatifs ;
- informer clairement talents et recruteurs du rôle de l’outil, de ses limites et de l’absence de décision automatique ;
- permettre à une personne habilitée de comprendre, ignorer, corriger ou arrêter l’utilisation d’un résultat ;
- journaliser les incidents et modifications significatives sans copier inutilement les documents ;
- revoir la classification et, si nécessaire, accomplir l’évaluation de conformité et les enregistrements requis avant mise en service.

## 7. Droits et transparence

- politique de confidentialité accessible avant inscription ;
- CGU acceptées via une case non précochée ;
- prise de connaissance de la politique enregistrée séparément ;
- version, date serveur, utilisateur et source d’inscription journalisés ;
- droit d’accès, rectification, suppression, limitation, portabilité et opposition selon le traitement ;
- explication publique des critères et de leur pondération ;
- absence de refus automatique clairement annoncée.

## 8. Sous-traitants et transferts

Avant production, conserver une copie datée du DPA, de la liste des sous-traitants ultérieurs, des régions de traitement et des garanties de transfert pour :

- Supabase ;
- Vercel ;
- Stripe ;
- Resend ;
- Groq ;
- Google OAuth.

## 9. Décisions à faire valider avant mise en production

- qualification exacte de Spotted Talent comme responsable ou sous-traitant selon chaque usage ;
- validation formelle de la présente AIPD, de ses mesures et des risques résiduels ;
- bases légales définitives par finalité ;
- durée de conservation automatisée des candidatures, messages et journaux ;
- procédure de contestation du matching ;
- qualification de chaque futur cas d’usage IA au regard de l’article 6 et de l’annexe III du règlement (UE) 2024/1689 ;
- procédure spécifique de formalités d’embauche ;
- nécessité d’un DPO selon le volume et le suivi réellement pratiqué.

## 10. Validation

| Rôle | Nom | Date | Décision |
| --- | --- | --- | --- |
| Responsable du traitement | Yousri Frigui |  |  |
| Référent technique | À compléter |  |  |
| Juriste ou DPO externe | À compléter |  |  |
