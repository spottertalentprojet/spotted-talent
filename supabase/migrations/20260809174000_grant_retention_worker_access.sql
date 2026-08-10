-- The retention Edge Function reads the due queue with the service-role
-- client before invoking the privileged finalizer. RLS bypass alone does not
-- grant table privileges on a fresh PostgreSQL instance, so grant only the
-- read access required by that worker.

GRANT SELECT ON TABLE public.document_encryption_keys TO service_role;
