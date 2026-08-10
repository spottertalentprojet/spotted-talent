-- These operational views must never be exposed through the public Data API.
-- security_invoker keeps underlying RLS effective as defense in depth, while
-- explicit grants reserve access to trusted server-side maintenance only.

ALTER VIEW public.anonymized_backup_profiles
  SET (security_invoker = true);

ALTER VIEW public.anonymized_backup_candidatures
  SET (security_invoker = true);

ALTER VIEW public.anonymized_backup_document_requests
  SET (security_invoker = true);

REVOKE ALL PRIVILEGES ON TABLE
  public.anonymized_backup_profiles,
  public.anonymized_backup_candidatures,
  public.anonymized_backup_document_requests
FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE
  public.anonymized_backup_profiles,
  public.anonymized_backup_candidatures,
  public.anonymized_backup_document_requests
TO service_role;

COMMENT ON VIEW public.anonymized_backup_profiles IS
  'Vue opérationnelle pseudonymisée, privée, accessible uniquement aux traitements serveur autorisés.';

COMMENT ON VIEW public.anonymized_backup_candidatures IS
  'Vue opérationnelle pseudonymisée, privée, accessible uniquement aux traitements serveur autorisés.';

COMMENT ON VIEW public.anonymized_backup_document_requests IS
  'Vue opérationnelle pseudonymisée, privée, accessible uniquement aux traitements serveur autorisés.';
