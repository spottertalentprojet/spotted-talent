import { supabase } from "@/integrations/supabase/client";

export type DocumentAccessAction =
  | "upload"
  | "open"
  | "download"
  | "delete"
  | "request_created"
  | "request_deleted"
  | "retention_deleted";

type DocumentAccessOptions = {
  fileName?: string | null;
  documentRequestId?: string | null;
  metadata?: Record<string, unknown>;
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
  const encrypted = await encryptDocumentFile(file);
  const encryptedBlob = new Blob([encrypted.encryptedBytes], { type: ENCRYPTED_DOCUMENT_CONTENT_TYPE });
  const { ownerId, category, relationId, documentRequestId } = getDocumentPathParts(storagePath);

  const { error: uploadError } = await supabase.storage.from("documents").upload(storagePath, encryptedBlob, {
    contentType: ENCRYPTED_DOCUMENT_CONTENT_TYPE,
  });

  if (uploadError) throw uploadError;

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (options.expiresInDays ?? 30));

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
  await supabase.from("document_encryption_keys").delete().eq("storage_path", storagePath);

  const { error } = await supabase.storage.from("documents").remove([storagePath]);
  if (error) throw error;

  void logDocumentAccess("delete", storagePath, options);
}

export async function openPrivateDocument(storagePath: string, options: DocumentAccessOptions = {}) {
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

  if (encryptionMetadata?.key_b64 && encryptionMetadata?.iv_b64) {
    const encryptedResponse = await fetch(data.signedUrl);
    if (!encryptedResponse.ok) {
      throw new Error("Impossible de récupérer ce document sécurisé.");
    }

    const decryptedBytes = await decryptDocumentBytes(
      await encryptedResponse.arrayBuffer(),
      encryptionMetadata.key_b64,
      encryptionMetadata.iv_b64,
    );
    const decryptedBlob = new Blob([decryptedBytes], {
      type: encryptionMetadata.original_mime_type || "application/octet-stream",
    });
    const objectUrl = URL.createObjectURL(decryptedBlob);
    window.open(objectUrl, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    void logDocumentAccess("open", storagePath, {
      ...options,
      fileName: options.fileName || encryptionMetadata.original_file_name,
      metadata: { encrypted: true, ...(options.metadata || {}) },
    });
    return;
  }

  window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  void logDocumentAccess("open", storagePath, options);
}
