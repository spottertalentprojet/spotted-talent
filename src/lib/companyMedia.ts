import { supabase } from "@/integrations/supabase/client";

export const COMPANY_COVER_FILE_NAME = "company-cover";

export const getCompanyCoverPath = (companyId: string) => `${companyId}/${COMPANY_COVER_FILE_NAME}`;

export const getCompanyCoverPublicUrl = (companyId?: string | null, cacheKey?: string | number) => {
  if (!companyId) return "";
  const { data } = supabase.storage.from("avatars").getPublicUrl(getCompanyCoverPath(companyId));
  return cacheKey ? `${data.publicUrl}?t=${cacheKey}` : data.publicUrl;
};

const MAX_COMPANY_COVER_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_COMPANY_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export const validateCompanyCoverImage = (file: File): string | null => {
  if (!ALLOWED_COMPANY_IMAGE_TYPES.has(file.type)) {
    return "Image refusée. Utilisez JPG, PNG ou WEBP.";
  }

  if (file.size > MAX_COMPANY_COVER_SIZE_BYTES) {
    return "Image trop lourde. Limite actuelle : 5 Mo.";
  }

  return null;
};
