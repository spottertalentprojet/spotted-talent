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

type ParsedTalentAvailability = {
  type: TalentAvailabilityType;
  detail: string;
  bio: string;
};

const talentAvailabilityTypes: TalentAvailabilityType[] = [
  "",
  "immediate",
  "one_week",
  "two_weeks",
  "one_month",
  "specific_date",
  "custom",
];

const isTalentAvailabilityType = (value: string): value is TalentAvailabilityType =>
  talentAvailabilityTypes.includes(value as TalentAvailabilityType);

export const parseTalentAvailabilityFromBio = (
  rawBio: string | null | undefined,
): ParsedTalentAvailability => {
  const source = String(rawBio || "");
  const match = source.match(/\[ST_AVAILABILITY\]([\s\S]*?)\[\/ST_AVAILABILITY\]/);

  if (!match) {
    return {
      type: "",
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

export const formatTalentAvailabilityLabel = (
  type: TalentAvailabilityType,
  detail?: string | null,
) => {
  const trimmedDetail = String(detail || "").trim();

  switch (type) {
    case "immediate":
      return "Disponible immediatement";
    case "one_week":
      return "Disponible sous 1 semaine";
    case "two_weeks":
      return "Disponible sous 2 semaines";
    case "one_month":
      return "Disponible sous 1 mois";
    case "specific_date":
      return trimmedDetail ? `Disponible a partir du ${trimmedDetail}` : "Disponible a une date precise";
    case "custom":
      return trimmedDetail || "Disponibilite personnalisee";
    default:
      return "";
  }
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

