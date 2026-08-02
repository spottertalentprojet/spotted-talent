import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TEXT_REPLACEMENTS: Array<[string, string]> = [
  ["\u00c3\u0080", "\u00c0"],
  ["\u00c3\u0087", "\u00c7"],
  ["\u00c3\u0089", "\u00c9"],
  ["\u00c3\u00a0", "\u00e0"],
  ["\u00c3\u00a2", "\u00e2"],
  ["\u00c3\u00a7", "\u00e7"],
  ["\u00c3\u00a8", "\u00e8"],
  ["\u00c3\u00a9", "\u00e9"],
  ["\u00c3\u00aa", "\u00ea"],
  ["\u00c3\u00ab", "\u00eb"],
  ["\u00c3\u00ae", "\u00ee"],
  ["\u00c3\u00af", "\u00ef"],
  ["\u00c3\u00b4", "\u00f4"],
  ["\u00c3\u00b9", "\u00f9"],
  ["\u00c3\u00bb", "\u00fb"],
  ["\u00c3\u00bc", "\u00fc"],
  ["\u00c5\u0093", "\u0153"],
  ["\u00c2\u00a0", " "],
  ["\u00e2\u0080\u0099", "'"],
  ["\u00e2\u0080\u0098", "'"],
  ["\u00e2\u0080\u009c", "\""],
  ["\u00e2\u0080\u009d", "\""],
  ["\u00e2\u0080\u0093", "-"],
  ["\u00e2\u0080\u0094", "-"],
  ["\u00e2\u0080\u00a6", "..."],
  ["\u20ac\u0099", "'"],
  ["a bien \ufffdt\ufffd re\ufffdue", "a bien \u00e9t\u00e9 re\u00e7ue"],
  ["sera \ufffdtudi\ufffde", "sera \u00e9tudi\u00e9e"],
  ["d\ufffdj\ufffd envoy\ufffde", "d\u00e9j\u00e0 envoy\u00e9e"],
  ["D\ufffdj\ufffd postul\ufffd", "D\u00e9j\u00e0 postul\u00e9"],
  ["R\ufffdduire", "R\u00e9duire"],
  ["compl\ufffdte", "compl\u00e8te"],
  ["Compatibilit\ufffd", "Compatibilit\u00e9"],
  ["pr\ufffdcis\ufffde", "pr\u00e9cis\u00e9e"],
  ["pr\ufffdcis\ufffd", "pr\u00e9cis\u00e9"],
  ["d\ufffds", "d\u00e8s"],
  ["r\ufffdpondra", "r\u00e9pondra"],
  ["re\ufffdue", "re\u00e7ue"],
  ["\ufffdt\ufffd", "\u00e9t\u00e9"],
  ["\ufffdtudi\ufffde", "\u00e9tudi\u00e9e"],
  ["\ufffd", ""],
];

const suspiciousTextScore = (value: string): number =>
  (value.match(/[\u00c3\u00c2\ufffd]/g) || []).length +
  (value.match(/\u00e2[\u0080-\u00bf]/g) || []).length * 2;

const decodeLatin1Utf8Text = (value: string): string => {
  if (!/[\u00c3\u00c2\u00e2]/.test(value)) return value;

  try {
    const bytes = Uint8Array.from(Array.from(value, (char) => char.charCodeAt(0) & 0xff));
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return suspiciousTextScore(decoded) < suspiciousTextScore(value) ? decoded : value;
  } catch {
    return value;
  }
};

export function formatStoredMessageText(value?: string | null): string {
  let text = decodeLatin1Utf8Text(String(value || ""));

  for (const [bad, good] of TEXT_REPLACEMENTS) {
    text = text.split(bad).join(good);
  }

  return text
    .replace(/\ufffd\s*([^\ufffd]{1,100}?)\s*\ufffd/g, "\u00ab $1 \u00bb")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

const MAX_DOCUMENT_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_DOCUMENT_EXTENSIONS = new Set(["pdf", "doc", "docx", "png", "jpg", "jpeg", "txt"]);
const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "text/plain",
]);

export const DOCUMENT_ACCEPT_ATTRIBUTE = ".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt";

export function sanitizeStorageFileName(fileName: string): string {
  const cleaned = fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 140);

  return cleaned || `document_${Date.now()}`;
}

export function validateDocumentFile(file: File): string | null {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";

  if (!ALLOWED_DOCUMENT_EXTENSIONS.has(extension)) {
    return "Format refusé. Utilisez PDF, Word, image JPG/PNG ou texte.";
  }

  if (file.type && !ALLOWED_DOCUMENT_MIME_TYPES.has(file.type)) {
    return "Type de fichier refusé par sécurité.";
  }

  if (file.size > MAX_DOCUMENT_FILE_SIZE_BYTES) {
    return "Fichier trop lourd. Limite actuelle : 10 Mo.";
  }

  return null;
}
