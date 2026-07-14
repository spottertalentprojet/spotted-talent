-- Track and rate-limit authenticated notification email delivery.

CREATE TABLE IF NOT EXISTS public.email_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (
    notification_type IN (
      'offer_published', 'new_offer', 'application_submitted',
      'new_application', 'application_status', 'new_message'
    )
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_usage_events_user_created_at_idx
  ON public.email_usage_events (user_id, created_at DESC);

ALTER TABLE public.email_usage_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.email_usage_events FROM anon, authenticated;
