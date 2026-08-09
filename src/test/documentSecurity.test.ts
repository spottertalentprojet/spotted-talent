import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getDocumentPathParts } from "@/lib/documentSecurity";
import { sanitizeStorageFileName } from "@/lib/utils";

const documentSecuritySource = readFileSync(
  resolve(process.cwd(), "src/lib/documentSecurity.ts"),
  "utf8",
);

describe("getDocumentPathParts", () => {
  it("ne confond pas le nom d'un document interne avec une candidature", () => {
    expect(getDocumentPathParts("entreprise-id/rh/1720000000000_modele.pdf")).toEqual({
      ownerId: "entreprise-id",
      category: "rh",
      relationId: null,
      documentRequestId: null,
    });
  });

  it("récupère uniquement la candidature pour un document partagé", () => {
    expect(getDocumentPathParts("entreprise-id/shared-contrat/candidature-id/1720000000000_contrat.pdf")).toEqual({
      ownerId: "entreprise-id",
      category: "shared-contrat",
      relationId: "candidature-id",
      documentRequestId: null,
    });
  });

  it("récupère la candidature et la demande pour une pièce demandée", () => {
    expect(getDocumentPathParts("talent-id/shared-requested/candidature-id/demande-id/1720000000000_rib.pdf")).toEqual({
      ownerId: "talent-id",
      category: "shared-requested",
      relationId: "candidature-id",
      documentRequestId: "demande-id",
    });
  });

  it("masque toujours l'URL signée derrière une URL Blob locale", () => {
    expect(documentSecuritySource).toContain("await fetch(data.signedUrl)");
    expect(documentSecuritySource).toContain("URL.createObjectURL(documentBlob)");
    expect(documentSecuritySource).not.toContain("window.open(data.signedUrl");
  });

  it("supprime une extension répétée dans le nom de stockage", () => {
    expect(sanitizeStorageFileName("CV Professionnel.pdf.pdf")).toBe("CV_Professionnel.pdf");
    expect(sanitizeStorageFileName("contrat.DOCX.DOCX")).toBe("contrat.DOCX");
    expect(sanitizeStorageFileName("archive.tar.gz")).toBe("archive.tar.gz");
  });
});
