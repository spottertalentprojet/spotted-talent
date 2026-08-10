-- Restore the historical core schema that predates the tracked migrations.
--
-- The production project already contains these columns and tables, but the
-- original migrations that created them were not committed. Keeping this
-- migration idempotent lets a fresh local Supabase instance reproduce the
-- schema without changing an existing production database.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS adresse TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS competences TEXT,
  ADD COLUMN IF NOT EXISTS contrat TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS localisation TEXT,
  ADD COLUMN IF NOT EXISTS nom TEXT,
  ADD COLUMN IF NOT EXISTS permis TEXT,
  ADD COLUMN IF NOT EXISTS poste TEXT,
  ADD COLUMN IF NOT EXISTS prenom TEXT,
  ADD COLUMN IF NOT EXISTS secteur TEXT,
  ADD COLUMN IF NOT EXISTS telephone TEXT,
  ADD COLUMN IF NOT EXISTS telephone2 TEXT;

CREATE TABLE IF NOT EXISTS public.offres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id UUID NOT NULL
    REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  description TEXT,
  localisation TEXT,
  contrat TEXT,
  salaire_min NUMERIC,
  salaire_max NUMERIC,
  competences TEXT,
  avantages TEXT,
  diplome TEXT,
  permis_requis TEXT,
  urgent BOOLEAN DEFAULT false,
  statut TEXT DEFAULT 'inactive',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.candidatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offre_id UUID NOT NULL
    REFERENCES public.offres(id) ON DELETE CASCADE,
  talent_id UUID NOT NULL
    REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  statut TEXT DEFAULT 'envoyee',
  note INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidature_id UUID NOT NULL
    REFERENCES public.candidatures(id) ON DELETE CASCADE,
  expedition_id UUID NOT NULL
    REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  destinataire_id UUID NOT NULL
    REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  contenu TEXT NOT NULL,
  lu BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
