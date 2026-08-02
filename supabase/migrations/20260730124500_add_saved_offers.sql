-- Saved offers belong to a single authenticated talent.
-- RLS prevents a user from reading or modifying another talent's favourites.

CREATE TABLE IF NOT EXISTS public.saved_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  offre_id UUID NOT NULL REFERENCES public.offres(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT saved_offers_talent_offer_unique UNIQUE (talent_id, offre_id)
);

CREATE INDEX IF NOT EXISTS saved_offers_talent_id_idx
  ON public.saved_offers (talent_id, created_at DESC);

CREATE INDEX IF NOT EXISTS saved_offers_offre_id_idx
  ON public.saved_offers (offre_id);

ALTER TABLE public.saved_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Talents can read own saved offers" ON public.saved_offers;
CREATE POLICY "Talents can read own saved offers"
ON public.saved_offers
FOR SELECT
USING (talent_id = auth.uid());

DROP POLICY IF EXISTS "Talents can save offers" ON public.saved_offers;
CREATE POLICY "Talents can save offers"
ON public.saved_offers
FOR INSERT
WITH CHECK (
  talent_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role = 'talent'
  )
  AND EXISTS (
    SELECT 1
    FROM public.offres o
    WHERE o.id = offre_id
      AND o.statut = 'active'
  )
);

DROP POLICY IF EXISTS "Talents can remove own saved offers" ON public.saved_offers;
CREATE POLICY "Talents can remove own saved offers"
ON public.saved_offers
FOR DELETE
USING (talent_id = auth.uid());
