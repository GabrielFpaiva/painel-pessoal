/**
 * Regras do arquivo do certificado. Puro: sem I/O. Espelha o CHECK de
 * `certificates.file_mime`/`file_size_bytes` e o teto do bucket, num lugar só.
 *
 * A compressão da imagem acontece no client; o que decide aceitar ou recusar
 * mora aqui, para ser testável sem navegador nem Storage.
 */

/** Igual ao teto do bucket `certificates` e ao CHECK da coluna. */
export const MAX_FILE_BYTES = 5 * 1024 * 1024;

export type CertificateMime = "application/pdf" | "image/png" | "image/jpeg";

const MIME_TO_EXT: Record<CertificateMime, "pdf" | "png" | "jpg"> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
};

export type FileError = "mime" | "too_big";

/** `null` quer dizer válido. */
export function validateFile(file: { mime: string; size: number }): FileError | null {
  // O tipo vem antes do tamanho: trocar o arquivo resolve os dois, encolher um
  // arquivo do tipo errado não adianta.
  if (!(file.mime in MIME_TO_EXT)) return "mime";
  if (file.size > MAX_FILE_BYTES) return "too_big";
  return null;
}

export function extForMime(mime: CertificateMime): "pdf" | "png" | "jpg" {
  return MIME_TO_EXT[mime];
}
