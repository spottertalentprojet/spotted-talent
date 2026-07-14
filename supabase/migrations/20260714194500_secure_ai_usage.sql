-- Keep AI provider credentials server-side and rate-limit authenticated usage.

CREATE TABLE IF NOT EXISTS public.ai_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task TEXT NOT NULL CHECK (task IN ('generate_offer', 'generate_bio', 'analyze_cv', 'cover_letter')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_usage_events_user_created_at_idx
  ON public.ai_usage_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ai_usage_events_user_task_created_at_idx
  ON public.ai_usage_events (user_id, task, created_at DESC);

ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.ai_usage_events FROM anon, authenticated;
