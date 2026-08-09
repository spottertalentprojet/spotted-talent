const CV_TEXT_MIN_LENGTH = 80;
const MAX_PDF_PAGES_TO_READ = 12;

const getFileExtension = (fileName: string) =>
  fileName.split(".").pop()?.toLowerCase() || "";

const normalizeExtractedText = (value: string) =>
  value
    .replace(/\0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const ensureReadableCvText = (text: string) => {
  const cleanText = normalizeExtractedText(text);

  if (cleanText.length < CV_TEXT_MIN_LENGTH) {
    throw new Error(
      "Le texte du CV est trop court ou illisible. Utilisez un PDF texte, un fichier DOCX ou un fichier TXT. Si votre CV est une image scannée, exportez-le en PDF avec texte sélectionnable.",
    );
  }

  return cleanText.slice(0, 12000);
};

const extractPdfText = async (file: File) => {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.mjs",
    import.meta.url,
  ).toString();

  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    isEvalSupported: false,
    useWorkerFetch: false,
  }).promise;

  const pageTexts: string[] = [];
  const pageCount = Math.min(pdf.numPages, MAX_PDF_PAGES_TO_READ);

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .map((item: any) => ("str" in item ? item.str : ""))
      .filter(Boolean)
      .join(" ");

    if (text.trim()) pageTexts.push(text);
  }

  return pageTexts.join("\n\n");
};

const extractDocxText = async (file: File) => {
  const mammoth = await import("mammoth/mammoth.browser");
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return String(result?.value || "");
};

export const extractCvTextFromFile = async (file: File) => {
  const extension = getFileExtension(file.name);

  if (extension === "txt" || file.type === "text/plain") {
    return ensureReadableCvText(await file.text());
  }

  if (extension === "pdf" || file.type === "application/pdf") {
    return ensureReadableCvText(await extractPdfText(file));
  }

  if (
    extension === "docx" ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return ensureReadableCvText(await extractDocxText(file));
  }

  if (extension === "doc" || file.type === "application/msword") {
    throw new Error(
      "Le format Word ancien .doc n'est pas lisible pour l'analyse. Enregistrez le CV en .docx, PDF texte ou TXT.",
    );
  }

  throw new Error("Format de CV non compatible pour l'analyse. Utilisez PDF, DOCX ou TXT.");
};
