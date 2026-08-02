import { formatStoredMessageText } from "@/lib/utils";

type OfferDescriptionSection = {
  title: string;
  lines: string[];
};

const normalizeHeading = (value: string): string | null => {
  const heading = value.trim().replace(/\s*[:：]\s*$/, "");
  if (/^(description|description du poste|description complète du poste|à propos du poste)$/i.test(heading)) return "À propos du poste";
  if (/^(missions|missions principales|vos missions)$/i.test(heading)) return "Vos missions";
  if (/^(profil|profil recherché|compétences|compétences recherchées)$/i.test(heading)) return "Profil recherché";
  if (/^(avantages|avantages proposés|ce que nous proposons)$/i.test(heading)) return "Ce que nous proposons";
  if (/^(inclusivité|notre engagement)$/i.test(heading)) return "Notre engagement";
  if (/^comment postuler$/i.test(heading)) return "Comment postuler";
  return null;
};

export const normalizeOfferDescription = (description?: string | null): string => {
  if (!description) return "";

  let value = formatStoredMessageText(description)
    .replace(/\r\n?/g, "\n")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/[`#>*_]+/g, " ")
    .replace(/\|\s*Crit[eè]re\s*\|\s*D[eé]tail\s*\|?/gi, "\nProfil recherché\n")
    .replace(/\|\s*:?-{2,}:?\s*\|\s*:?-{2,}:?\s*\|?/g, "\n")
    .replace(/\|\s*([^|\n]+?)\s*\|\s*([^|\n]+?)\s*\|/g, "\n• $1 : $2")
    .replace(/\s*---+\s*/g, "\n\n")
    .replace(/\s*(?:📝|🎯|👤|🎁|🛡️|📩)\s*/gu, "\n")
    .replace(/\s*•\s*/g, "\n• ")
    .replace(/\s*(Description(?: complète)?(?: du poste)?|À propos du poste|Missions(?: principales)?|Vos missions|Profil recherché|Compétences recherchées|Avantages(?: proposés)?|Ce que nous proposons|Inclusivité|Notre engagement|Comment postuler)\s*[:：]?\s*/gi, "\n$1\n")
    .replace(/(?:^|\s)[–—-]\s+(?=[A-ZÀ-ÖØ-Þ])/g, "\n• ")
    .replace(/[ \t]*\|[ \t]*/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const firstUsefulHeading = value.search(/(?:^|\n)(?:Description(?: complète)?(?: du poste)?|À propos du poste|Missions(?: principales)?|Vos missions|Profil recherché)\s*(?:\n|:)/i);
  if (firstUsefulHeading > 0) value = value.slice(firstUsefulHeading).trim();

  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
};

export const parseOfferDescription = (description?: string | null): OfferDescriptionSection[] => {
  const normalized = normalizeOfferDescription(description);
  if (!normalized) return [];

  const sections: OfferDescriptionSection[] = [];
  let current: OfferDescriptionSection = { title: "À propos du poste", lines: [] };

  const pushCurrent = () => {
    if (current.lines.length > 0 && !["Comment postuler", "Notre engagement"].includes(current.title)) {
      sections.push(current);
    }
  };

  normalized.split("\n").forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) return;
    const heading = normalizeHeading(line);
    if (heading) {
      pushCurrent();
      current = { title: heading, lines: [] };
      return;
    }

    const readableLines = line.length > 280 && !line.startsWith("•")
      ? line.split(/(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Þ])/).filter(Boolean)
      : [line];
    current.lines.push(...readableLines);
  });
  pushCurrent();

  return sections.slice(0, 4).map((section) => ({
    ...section,
    lines: section.lines.slice(0, 6),
  }));
};

export const getOfferDescriptionPreview = (description?: string | null, limit = 180): string => {
  const preview = parseOfferDescription(description)
    .flatMap((section) => section.lines)
    .map((line) => line.replace(/^•\s*/, ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (!preview) return "Le descriptif du poste apparaîtra ici une fois l'offre ouverte.";
  return preview.length <= limit ? preview : `${preview.slice(0, limit).trimEnd()}…`;
};

const OfferDescription = ({ description, compact = false }: { description?: string | null; compact?: boolean }) => {
  const sections = parseOfferDescription(description);
  if (sections.length === 0) {
    return <p className="text-sm text-muted-foreground">La description détaillée sera ajoutée prochainement.</p>;
  }

  return (
    <div className={compact ? "space-y-4" : "space-y-5"}>
      {sections.map((section) => (
        <section key={section.title}>
          <h5 className="mb-2 text-sm font-bold text-foreground">{section.title}</h5>
          <div className="space-y-2 text-sm leading-6 text-muted-foreground">
            {section.lines.map((line, index) => line.startsWith("•") ? (
              <div key={`${section.title}-${index}`} className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                <p>{line.replace(/^•\s*/, "")}</p>
              </div>
            ) : (
              <p key={`${section.title}-${index}`}>{line}</p>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default OfferDescription;
