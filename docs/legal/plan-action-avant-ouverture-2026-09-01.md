# Plan d’action avant l’ouverture commerciale — 1er septembre 2026

Date de mise à jour : 9 août 2026
Responsable principal : Yousri Frigui — entrepreneur individuel, Spotted Talent
Statut : document de pilotage interne à remettre au juriste, au DPO et à l’expert-comptable

## Légende

- **TERMINÉ** : réalisé dans le produit ou dans la documentation interne ;
- **À VALIDER** : travail préparé, mais validation professionnelle ou décision formelle encore nécessaire ;
- **BLOQUANT** : doit être tranché avant l’encaissement de clients ou le traitement à grande échelle de candidatures réelles ;
- **À TESTER** : mesure présente sur le papier ou dans le code, mais preuve de fonctionnement réel encore nécessaire ;
- **RECOMMANDÉ** : protection utile, sans être automatiquement une obligation légale pour cette activité.

## Priorités juridiques et administratives

| Priorité | Action | Responsable | Échéance interne | Statut | Preuve ou prochaine action |
| --- | --- | --- | --- | --- | --- |
| P0 | Confirmer le régime de TVA : franchise en base ou option/régime réel | Yousri + SIE ou expert-comptable | 15 août 2026 | **BLOQUANT** | Obtenir une réponse écrite. Le paiement Stripe applique actuellement 20 % de TVA : ne pas encaisser de client réel tant que ce choix et le paramétrage ne concordent pas. |
| P0 | Aligner Stripe, les prix, les factures et les mentions fiscales avec la décision TVA | Référent technique après décision de Yousri | 16 août 2026 | **BLOQUÉ PAR LA TVA** | Si franchise : ne pas collecter la TVA et afficher la mention fiscale applicable. Si TVA : conserver le calcul approprié et contrôler le numéro de TVA. |
| P0 | Choisir un médiateur de la consommation référencé par la CECMC et signer la convention | Yousri | 20 août 2026 | **BLOQUANT EXTERNE** | Transmettre ensuite son nom, son adresse et son site pour publication. Faire confirmer son applicabilité exacte au service gratuit Talent. |
| P0 | Valider la qualification RGPD, traitement par traitement | Yousri + juriste/DPO | 20 août 2026 | **À VALIDER** | Utiliser `docs/rgpd/qualification-roles-rgpd.md` comme note de travail. |
| P0 | Finaliser et signer l’AIPD recrutement/matching/documents | Yousri + juriste/DPO | 24 août 2026 | **BLOQUANT** | Le brouillon existe ; compléter les risques résiduels, responsables, preuves de tests et décision finale. |
| P0 | Finaliser le registre des traitements article 30 | Yousri + juriste/DPO | 24 août 2026 | **BLOQUANT** | Distinguer les activités de responsable de traitement et de sous-traitant ; dater et signer la version finale. |
| P0 | Archiver les DPA et garanties de transfert des fournisseurs | Yousri + juriste/DPO | 24 août 2026 | **BLOQUANT** | Supabase, Vercel, Stripe, Resend, Groq et Google : DPA, sous-traitants ultérieurs, régions de traitement et transferts. |
| P0 | Préparer le DPA article 28 proposé aux entreprises clientes | Juriste/DPO | 24 août 2026 | **À VALIDER** | Nécessaire pour les opérations réellement exécutées pour le compte du recruteur. |
| P0 | Relecture externe des CGU, CGV et politique de confidentialité | Juriste | 24 août 2026 | **À VALIDER** | Les clauses de modification, résiliation, remboursement, renouvellement, responsabilité, non-discrimination et supervision humaine sont déjà rédigées ; vérifier leur opposabilité et leur cohérence. |
| P0 | Réaliser les trois tests de sécurité critiques | Référent technique + Yousri | 25 août 2026 | **À TESTER** | Accès croisés entre comptes ; expiration/révocation des liens ; exercice de violation de données. Conserver un compte rendu daté. |
| P1 | Configurer et vérifier SPF, DKIM et DMARC | Référent technique | 25 août 2026 | **À TESTER** | Tester Gmail, Outlook et mobile, y compris réinitialisation de mot de passe. |
| P1 | Faire un parcours complet Stripe en production contrôlée | Yousri + référent technique | Après décision TVA | **À TESTER** | Inscription, CGV, paiement, facture, renouvellement, résiliation et échec de paiement. |
| P1 | Faire tester le parcours par un recruteur et un talent non techniques | Yousri | 28 août 2026 | **À TESTER** | Documenter les blocages et corriger uniquement les défauts critiques avant ouverture. |

## Protection personnelle de l’entrepreneur individuel

Le patrimoine professionnel et le patrimoine personnel d’un entrepreneur individuel sont séparés automatiquement. Cette protection n’est toutefois pas une immunité totale : des exceptions existent notamment pour certaines dettes fiscales ou sociales, la fraude, des manquements graves, une renonciation volontaire à la séparation au profit d’un créancier ou une garantie personnelle consentie.

| Action | Échéance | Statut | Recommandation pratique |
| --- | --- | --- | --- |
| Demander des devis RC Pro adaptés à un SaaS de recrutement | 20 août 2026 | **RECOMMANDÉ** | Couvrir erreur de service, atteinte aux données, préjudice immatériel et réclamation d’un client. |
| Ajouter une assurance cyber et gestion de crise | 20 août 2026 | **RECOMMANDÉ FORT** | Vérifier incident, restauration, notification, expertise et assistance juridique. |
| Étudier une protection juridique professionnelle | 20 août 2026 | **RECOMMANDÉ** | Vérifier litiges clients, fournisseurs, données et propriété intellectuelle. |
| Vérifier l’interruption d’activité et la perte d’exploitation | 25 août 2026 | **RECOMMANDÉ** | Comparer plafond, franchise, exclusions et délai de carence. |
| Faire apparaître « Entrepreneur individuel » ou « EI » avec le nom légal sur les documents commerciaux | Avant première facture | **À VÉRIFIER** | Contrôler devis, factures, contrats, tarifs et compte bancaire professionnel. |
| Ne pas signer de renonciation patrimoniale ou de caution personnelle sans conseil | Permanent | **RÈGLE DE PRUDENCE** | Faire relire tout engagement bancaire ou commercial de ce type. |
| Comparer plus tard EI, EURL et SASU | Après validation commerciale | **NON BLOQUANT** | Un changement de forme dépendra du chiffre d’affaires, du financement et de la rémunération ; il ne supprime pas la responsabilité en cas de faute personnelle. |

Pour l’activité informatique/SaaS non réglementée décrite au RNE, la RC Pro n’est pas automatiquement obligatoire comme elle peut l’être pour certaines professions réglementées. Elle reste néanmoins fortement recommandée compte tenu du recrutement, des données personnelles et des documents manipulés.

## Qualification RGPD à faire trancher

La qualification doit être décidée pour chaque traitement, d’après les finalités et les moyens réellement déterminés :

- **Spotted Talent responsable de traitement probable** : comptes, sécurité, facturation, support, fonctionnement propre de la plateforme, journaux et certaines propositions de matching ;
- **entreprise cliente responsable de traitement** : décision de recruter, critères propres à son recrutement, examen et conservation de son dossier candidat ;
- **Spotted Talent sous-traitant possible** : opérations strictement exécutées pour le compte de l’entreprise et selon ses instructions ;
- **responsabilité autonome ou conjointe à examiner** : classement/matching si la plateforme détermine une finalité ou influence substantiellement la sélection.

Conséquence : si Spotted Talent est responsable du traitement concerné, il évalue la notification à la CNIL dans les 72 heures après avoir pris connaissance d’une violation notifiable. S’il est sous-traitant, il alerte le client responsable sans délai indu et l’assiste. Cette répartition doit être reproduite dans le registre, les contrats, le DPA, l’AIPD et la procédure d’incident.

## AI Act : position prudente au 9 août 2026

Les usages d’IA destinés au recrutement, à la présélection, au filtrage ou à l’évaluation peuvent relever des systèmes à haut risque. Selon le calendrier officiel européen actualisé en juillet 2026, les règles propres aux cas à haut risque de l’annexe III, dont l’emploi, doivent s’appliquer à compter du 2 décembre 2027. Cette échéance ne dispense pas Spotted Talent de respecter dès maintenant le RGPD, la non-discrimination, la transparence applicable, la supervision humaine et la sécurité, ni de préparer sa documentation avant toute évolution du matching.

Le score actuel est présenté comme déterministe et non décisionnel. Cette conclusion doit être vérifiée sur l’usage réel : une entreprise ne doit pas pouvoir transformer le score en refus automatique ou en filtre opaque sans nouvelle analyse juridique et technique.

## Tests de sécurité à produire comme preuves

1. **Accès croisés** : créer deux talents et deux entreprises de test ; tenter d’ouvrir les profils, candidatures, messages et documents d’un autre compte avec l’interface puis directement avec les identifiants d’objets.
2. **Liens documentaires** : générer un lien signé court, vérifier son expiration, révoquer l’autorisation de partage, puis vérifier qu’un nouveau lien n’est plus délivré et que l’ancien n’offre pas un accès durable.
3. **Exercice d’incident** : simuler une fuite sans donnée réelle ; identifier le traitement, les personnes, le rôle RGPD, la gravité, l’heure de découverte, les mesures de confinement, l’information du client/CNIL/personnes et la décision finale.
4. **Compte rendu** : conserver date, participants, comptes utilisés, captures expurgées, résultats, anomalies, correctifs et contre-test.

## Décisions manuelles attendues de Yousri

1. Contacter le SIE ou un expert-comptable et obtenir la confirmation écrite du régime de TVA au 1er septembre 2026.
2. Choisir le médiateur et l’assurance après comparaison des contrats.
3. Choisir le juriste/DPO chargé de valider les rôles RGPD, l’AIPD, le registre, les DPA et les textes contractuels.
4. Ne jamais transmettre dans ce dossier de mot de passe, clé API, clé Supabase ou secret Stripe.

## Sources officielles de travail

- TVA : https://www.impots.gouv.fr/professionnel/tva
- Régimes de TVA : https://www.impots.gouv.fr/professionnel/les-regimes-dimposition-la-tva
- Entrepreneur individuel : https://entreprendre.service-public.fr/vosdroits/F37396
- Assurances professionnelles : https://www.economie.gouv.fr/entreprises/gerer-ses-ressources-humaines-et-ses-salaries/professionnels-quelles-sont-les-assurances-obligatoires
- Qualification RGPD : https://www.cnil.fr/fr/rgpd-comment-bien-identifier-son-role
- Registre article 30 : https://www.cnil.fr/fr/RGPD-le-registre-des-activites-de-traitement
- AIPD : https://www.cnil.fr/fr/RGPD-analyse-impact-protection-des-donnees-aipd
- Guide CNIL recrutement : https://www.cnil.fr/sites/default/files/atoms/files/guide_-_recrutement.pdf
- Calendrier AI Act : https://digital-strategy.ec.europa.eu/en/policies/guidelines-ai-high-risk-systems
