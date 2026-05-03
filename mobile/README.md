# Spotted Talent Mobile (Expo)

## 1) Configuration

Create `mobile/.env` from `mobile/.env.example`:

```bash
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

## 2) Start

```bash
npm install
npm run start
```

Then scan the QR code with Expo Go.

## 3) What is already wired

- Supabase session persistence with AsyncStorage.
- Login by email/password.
- Role detection via `profiles.role`.
- Automatic redirection:
  - `talent` -> Talent home.
  - `entreprise` -> Entreprise home.
