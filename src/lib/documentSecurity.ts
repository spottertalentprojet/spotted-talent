import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { assertDocumentsAvailable } from "@/lib/platformSecurity";
import { getInitialDocumentExpiry } from "@/lib/documentRetention";

export type DocumentAccessAction =
  | "upload"
  | "open"
  | "download"
  | "delete"
  | "request_created"
  | "request_deleted"
  | "retention_deleted"
  | "receipt_confirmed"
  | "document_supprimé";

type DocumentAccessOptions = {
  fileName?: string | null;
  documentRequestId?: string | null;
  metadata?: Record<string, Json | undefined>;
};

type UploadPrivateDocumentOptions = DocumentAccessOptions & {
  expiresInDays?: number;
};

type EncryptedDocumentPayload = {
  encryptedBytes: Uint8Array;
  ivB64: string;
  keyB64: string;
};

const ENCRYPTED_DOCUMENT_CONTENT_TYPE = "application/octet-stream";

const isMissingRetentionRpc = (error: { code?: string; message?: string } | null) =>
  Boolean(
    error
      && (
        error.code === "PGRST202"
        || error.message?.includes("schema cache")
        || error.message?.includes("Could not find the function")
      ),
  );

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export function getDocumentPathParts(storagePath: string) {
  const [ownerId, category, thirdPart, fourthPart] = storagePath.split("/");
  const sharedCategories = new Set(["shared-contrat", "shared-fiche-paie", "shared-interim", "shared-requested"]);
  return {
    ownerId,
    category,
    relationId: sharedCategories.has(category) ? thirdPart || null : null,
    documentRequestId: category === "shared-requested" ? fourthPart || null : null,
  };
}

async function encryptDocumentFile(file: File): Promise<EncryptedDocumentPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, await file.arrayBuffer());
  const rawKey = await crypto.subtle.exportKey("raw", key);

  return {
    encryptedBytes: new Uint8Array(encrypted),
    ivB64: bytesToBase64(iv),
    keyB64: bytesToBase64(new Uint8Array(rawKey)),
  };
}

async function decryptDocumentBytes(encryptedBytes: ArrayBuffer, keyB64: string, ivB64: string): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey(
    "raw",
    base64ToBytes(keyB64),
    { name: "AES-GCM" },
    false,
    ["decrypt"],
  );

  return crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBytes(ivB64) }, key, encryptedBytes);
}

export async function logDocumentAccess(
  action: DocumentAccessAction,
  storagePath?: string | null,
  options: DocumentAccessOptions = {},
) {
  const { error } = await supabase.rpc("log_document_access", {
    p_action: action,
    p_storage_path: storagePath || null,
    p_file_name: options.fileName || null,
    p_document_request_id: options.documentRequestId || null,
    p_metadata: options.metadata || {},
  });

  if (error) {
    console.warn("document_access_log_failed", error.message);
  }
}

export async function uploadPrivateDocument(
  storagePath: string,
  file: File,
  options: UploadPrivateDocumentOptions = {},
) {
  await assertDocumentsAvailable();
  const encrypted = await encryptDocumentFile(file);
  const encryptedBlob = new Blob([encrypted.encryptedBytes], { type: ENCRYPTED_DOCUMENT_CONTENT_TYPE });
  const { ownerId, category, relationId, documentRequestId } = getDocumentPathParts(storagePath);

  const { error: uploadError } = await supabase.storage.from("documents").upload(storagePath, encryptedBlob, {
    contentType: ENCRYPTED_DOCUMENT_CONTENT_TYPE,
  });

  if (uploadError) throw uploadError;

  const expiresAt = options.expiresInDays
    ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000)
    : getInitialDocumentExpiry(category);

  const { error: metadataError } = await supabase.from("document_encryption_keys").insert({
    storage_path: storagePath,
    owner_id: ownerId,
    category,
    relation_id: relationId,
    document_request_id: options.documentRequestId || documentRequestId,
    original_file_name: file.name,
    original_mime_type: file.type || "application/octet-stream",
    original_size_bytes: file.size,
    encrypted_size_bytes: encrypted.encryptedBytes.byteLength,
    iv_b64: encrypted.ivB64,
    key_b64: encrypted.keyB64,
    expires_at: expiresAt.toISOString(),
  });

  if (metadataError) {
    await supabase.storage.from("documents").remove([storagePath]);
    throw metadataError;
  }

  void logDocumentAccess("upload", storagePath, {
    fileName: options.fileName || file.name,
    documentRequestId: options.documentRequestId || documentRequestId,
    metadata: {
      encrypted: true,
      originalSize: file.size,
      encryptedSize: encrypted.encryptedBytes.byteLength,
      ...(options.metadata || {}),
    },
  });
}

export async function deletePrivateDocument(storagePath: string, options: DocumentAccessOptions = {}) {
  await assertDocumentsAvailable();
  const { error } = await supabase.storage.from("documents").remove([storagePath]);
  if (error) throw error;

  const { error: retentionError } = await supabase.rpc("record_manual_document_deletion", {
    p_storage_path: storagePath,
  });

  if (retentionError) {
    if (!isMissingRetentionRpc(retentionError)) throw retentionError;
    await supabase.from("document_encryption_keys").delete().eq("storage_path", storagePath);
    void logDocumentAccess("delete", storagePath, options);
  }
}

export async function confirmDocumentReceipt(storagePath: string) {
  await assertDocumentsAvailable();
  const { data, error } = await supabase.rpc("record_document_receipt", {
    p_storage_path: storagePath,
    p_receipt_method: "confirmation",
  });

  if (error) throw error;
  if (!data) throw new Error("Ce document ne peut pas être confirmé comme reçu.");
  return data;
}

async function recordSuccessfulDocumentDownload(
  storagePath: string,
  options: DocumentAccessOptions,
  fileName?: string | null,
) {
  const { data, error } = await supabase.rpc("record_document_receipt", {
    p_storage_path: storagePath,
    p_receipt_method: "download",
  });

  if (error && !isMissingRetentionRpc(error)) throw error;

  if (!data) {
    await logDocumentAccess("open", storagePath, {
      ...options,
      fileName: options.fileName || fileName,
      metadata: { encrypted: true, ...(options.metadata || {}) },
    });
  }
}

export async function openPrivateDocument(storagePath: string, options: DocumentAccessOptions = {}) {
  await assertDocumentsAvailable();
  const { data: encryptionMetadata, error: metadataError } = await supabase
    .from("document_encryption_keys")
    .select("original_file_name, original_mime_type, iv_b64, key_b64")
    .eq("storage_path", storagePath)
    .maybeSingle();

  if (metadataError && metadataError.code !== "PGRST116") {
    throw metadataError;
  }

  const { data, error } = await supabase.storage.from("documents").createSignedUrl(storagePath, 60);
  if (error) throw error;

  if (!data?.signedUrl) return;

  const documentResponse = await fetch(data.signedUrl);
  if (!documentResponse.ok) {
    throw new Error("Impossible de récupérer ce document sécurisé.");
  }

  let documentBlob: Blob;

  if (encryptionMetadata?.key_b64 && encryptionMetadata?.iv_b64) {
    const decryptedBytes = await decryptDocumentBytes(
      await documentResponse.arrayBuffer(),
      encryptionMetadata.key_b64,
      encryptionMetadata.iv_b64,
    );
    documentBlob = new Blob([decryptedBytes], {
      type: encryptionMetadata.original_mime_type || "application/octet-stream",
    });
  } else {
    // Les anciens documents peuvent ne pas encore avoir de métadonnées de
    // chiffrement. L'URL signée reste interne et n'apparaît jamais dans la
    // barre d'adresse du navigateur.
    documentBlob = await documentResponse.blob();
  }

  await recordSuccessfulDocumentDownload(
    storagePath,
    options,
    encryptionMetadata?.original_file_name || options.fileName,
  );
  const objectUrl = URL.createObjectURL(documentBlob);
  window.open(objectUrl, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}
