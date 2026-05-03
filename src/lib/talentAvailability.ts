const AVAILABILITY_START = "[ST_AVAILABILITY]";
const AVAILABILITY_END = "[/ST_AVAILABILITY]";

export type TalentAvailabilityType =
  | "immediate"
  | "one_week"
  | "two_weeks"
  | "one_month"
  | "specific_date"
  | "custom"
  | "";

export const TALENT_AVAILABILITY_OPTIONS: Array<{ value: TalentAvailabilityType; label: string }> = [
  { value: "", label: "À préciser" },
  { value: "immediate", label: "Disponible immédiatement" },
  { value: "one_week", label: "Disponible sous 1 semaine" },
  { value: "two_weeks", label: "Disponible sous 2 semaines" },
  { value: "one_month", label: "Disponible sous 1 mois" },
  { value: "specific_date", label: "Disponible à partir d'une date précise" },
  { value: "custom", label: "Disponibilité personnalisée" },
];

type ParsedTalentAvailability = {
  type: TalentAvailabilityType;
  detail: string;
  bio: string;
};

const isTalentAvailabilityType = (value: string): value is TalentAvailabilityType =>
  TALENT_AVAILABILITY_OPTIONS.some((option) => option.value === value);

export const parseTalentAvailabilityFromBio = (rawBio: string | null | undefined): ParsedTalentAvailability => {
  const source = String(rawBio || "");
  const match = source.match(/\[ST_AVAILABILITY\]([\s\S]*?)\[\/ST_AVAILABILITY\]/);

  if (!match) {
    return {
      type: "" as TalentAvailabilityType,
      detail: "",
      bio: source.trim(),
    };
  }

  const [type = "", detail = ""] = String(match[1]).split("||");
  const cleanBio = source.replace(match[0], "").trim();
  const trimmedType = type.trim();

  return {
    type: isTalentAvailabilityType(trimmedType) ? trimmedType : "",
    detail: detail.trim(),
    bio: cleanBio,
  };
};

export const buildTalentBioWithAvailability = (
  cleanBio: string,
  type: TalentAvailabilityType,
  detail: string,
) => {
  const safeBio = cleanBio.trim();
  if (!type) return safeBio;

  const safeDetail = detail.trim();
  const meta = `${AVAILABILITY_START}${type}||${safeDetail}${AVAILABILITY_END}`;
  return safeBio ? `${meta}\n\n${safeBio}` : meta;
};

export const stripTalentAvailabilityMetadata = (rawBio: string | null | undefined) =>
  parseTalentAvailabilityFromBio(rawBio).bio;

export const formatTalentAvailabilityLabel = (
  type: TalentAvailabilityType,
  detail?: string | null,
) => {
  const trimmedDetail = String(detail || "").trim();

  switch (type) {
    case "immediate":
      return "Disponible immédiatement";
    case "one_week":
      return "Disponible sous 1 semaine";
    case "two_weeks":
      return "Disponible sous 2 semaines";
    case "one_month":
      return "Disponible sous 1 mois";
    case "specific_date":
      return trimmedDetail ? `Disponible à partir du ${trimmedDetail}` : "Disponible à une date précise";
    case "custom":
      return trimmedDetail || "Disponibilité personnalisée";
    default:
      return "";
  }
};
