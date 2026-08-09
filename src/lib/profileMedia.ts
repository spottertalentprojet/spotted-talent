import { supabase } from "@/integrations/supabase/client";

const MAX_PROFILE_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
const PROFILE_IMAGE_EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const PROFILE_IMAGE_ACCEPT_ATTRIBUTE = Object.keys(PROFILE_IMAGE_EXTENSION_BY_MIME).join(",");

export const validateProfileImage = (file: File): string | null => {
  if (!PROFILE_IMAGE_EXTENSION_BY_MIME[file.type]) {
    return "Image refusée. Utilisez un fichier JPG, PNG ou WEBP.";
  }

  if (file.size > MAX_PROFILE_IMAGE_SIZE_BYTES) {
    return "Image trop lourde. La taille maximale est de 2 Mo.";
  }

  return null;
};

export const uploadProfileImage = async (userId: string, file: File): Promise<string> => {
  const validationError = validateProfileImage(file);
  if (validationError) throw new Error(validationError);

  const extension = PROFILE_IMAGE_EXTENSION_BY_MIME[file.type];
  const path = `${userId}/avatar.${extension}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    upsert: true,
    contentType: file.type,
    cacheControl: "3600",
  });
  if (error) throw error;

  // Une seule image de profil doit rester active. Le nettoyage intervient après
  // l'envoi réussi afin de conserver l'ancien fichier si le nouvel envoi échoue.
  const { data: existingFiles } = await supabase.storage.from("avatars").list(userId);
  const stalePaths = (existingFiles || [])
    .filter((item) => item.name.startsWith("avatar.") && `${userId}/${item.name}` !== path)
    .map((item) => `${userId}/${item.name}`);
  if (stalePaths.length > 0) await supabase.storage.from("avatars").remove(stalePaths);

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
};
