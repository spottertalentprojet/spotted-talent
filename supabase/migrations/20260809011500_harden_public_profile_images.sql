-- Réduit la surface d'attaque du bucket public utilisé pour les logos et photos.
-- Les SVG sont volontairement exclus car ils peuvent contenir du contenu actif.
UPDATE storage.buckets
SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
WHERE id = 'avatars';
