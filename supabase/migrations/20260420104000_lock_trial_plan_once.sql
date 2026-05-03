CREATE OR REPLACE FUNCTION public.prevent_trial_plan_locked_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.trial_plan_locked IS NOT NULL
     AND NEW.trial_plan_locked IS DISTINCT FROM OLD.trial_plan_locked THEN
    RAISE EXCEPTION 'trial_plan_locked_already_set';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_trial_plan_locked_change_trigger ON public.billing_accounts;
CREATE TRIGGER prevent_trial_plan_locked_change_trigger
BEFORE UPDATE ON public.billing_accounts
FOR EACH ROW
EXECUTE FUNCTION public.prevent_trial_plan_locked_change();
