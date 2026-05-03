ALTER TABLE IF EXISTS public.billing_accounts
ADD COLUMN IF NOT EXISTS trial_plan_locked TEXT
CHECK (trial_plan_locked IN ('starter', 'boost', 'premium'));
