# Registre des risques de dépendances

Dernière revue : 3 août 2026

## React Router — GHSA-qwww-vcr4-c8h2

- Version utilisée : `react-router-dom@7.18.2`.
- Signal npm : sévérité haute, vulnérabilité CSRF des actions en mode React Server Components (RSC).
- Exposition de Spotted Talent : non applicable dans l’architecture actuelle. L’application est une SPA Vite utilisant `BrowserRouter`; elle n’active ni RSC, ni SSR React Router, ni action serveur React Router.
- Décision : conserver `7.18.2`. Au 3 août 2026, il s’agit de la dernière version stable publiée et aucune version stable corrigée n’est disponible. Le downgrade proposé automatiquement par npm réintroduirait des vulnérabilités plus générales déjà corrigées.
- Suivi : mettre à jour dès qu’une version stable corrigée est publiée, ou réévaluer avant toute adoption du mode Framework/RSC.

## esbuild — GHSA-67mh-4wv8-2f99

- Dépendance indirecte de développement via Vite 5.
- Signal npm : sévérité modérée, lecture possible des réponses du serveur de développement par un site tiers.
- Exposition de Spotted Talent : absente du bundle et du serveur de production Vercel. Les tests automatisés démarrent Vite sur `127.0.0.1` et le serveur de développement n’est pas exposé publiquement.
- Décision : ne pas forcer une migration majeure vers Vite 8 pendant la stabilisation de lancement.
- Suivi : planifier la migration Vite/plugin React dans un lot isolé avec validation visuelle et tests complets.

## Contrôles compensatoires

- `npm audit --omit=dev` est exécuté pendant la revue de lancement.
- Les parcours publics et authentifiés sont testés avec Playwright.
- Le lint, les tests unitaires et le build de production sont obligatoires avant déploiement.
- Toute activation future de SSR, RSC ou d’un serveur Vite accessible sur le réseau impose une nouvelle revue de ce registre.
