-- Harden profile uniqueness and add indexes for frequently queried columns.

-- Keep a single profile row per user_id before enforcing uniqueness.
WITH ranked_profiles AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
    ) AS row_rank
  FROM public.profiles
)
DELETE FROM public.profiles p
USING ranked_profiles rp
WHERE p.id = rp.id
  AND rp.row_rank > 1;

-- Ensure ON CONFLICT(user_id) remains valid even if the unique index is missing.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND indexdef ILIKE 'CREATE UNIQUE INDEX%ON public.profiles% (user_id)%'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX profiles_user_id_unique_idx ON public.profiles (user_id)';
  END IF;
END $$;

-- Frequently queried business indexes.
CREATE INDEX IF NOT EXISTS offres_entreprise_id_idx
  ON public.offres (entreprise_id);

CREATE INDEX IF NOT EXISTS offres_statut_idx
  ON public.offres (statut);

CREATE INDEX IF NOT EXISTS candidatures_talent_id_idx
  ON public.candidatures (talent_id);

CREATE INDEX IF NOT EXISTS candidatures_offre_id_idx
  ON public.candidatures (offre_id);

CREATE INDEX IF NOT EXISTS candidatures_statut_idx
  ON public.candidatures (statut);

CREATE INDEX IF NOT EXISTS messages_candidature_id_idx
  ON public.messages (candidature_id);

CREATE INDEX IF NOT EXISTS messages_expedition_id_idx
  ON public.messages (expedition_id);

CREATE INDEX IF NOT EXISTS messages_destinataire_id_idx
  ON public.messages (destinataire_id);

CREATE INDEX IF NOT EXISTS messages_destinataire_id_lu_idx
  ON public.messages (destinataire_id, lu);
