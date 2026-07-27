"use server";

import { revalidatePath } from "next/cache";

import {
  validateInput,
  type CertificateFieldError,
  type CertificateInput,
} from "@/domain/certificates/certificate";
import type { CertificateMime } from "@/domain/certificates/file";
import { createClient } from "@/lib/supabase/server";

/**
 * Erro de action de certificado. `validation` carrega o campo e o motivo para a
 * UI acender o campo certo; o resto é situação, não campo.
 */
export type CertActionError =
  | "not_authenticated"
  | "not_found"
  | "no_file"
  | "unknown"
  | { field: CertificateFieldError["field"]; code: CertificateFieldError["code"] };

/** Campos que o formulário manda. `is_public` é o toggle; o resto é do schema. */
export type CertificateFields = CertificateInput & { is_public: boolean };

type FilePayload = { path: string; mime: CertificateMime; size: number };

/** "" vira null: campo opcional em branco não é string vazia no banco. */
function orNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** Normaliza os campos do formulário para o shape de linha do banco. */
function toRow(fields: CertificateFields) {
  return {
    title: fields.title.trim(),
    institution: orNull(fields.institution),
    issued_on: orNull(fields.issued_on),
    expires_on: orNull(fields.expires_on),
    workload_hours:
      fields.workload_hours === null || fields.workload_hours === undefined
        ? null
        : fields.workload_hours,
    credential_id: orNull(fields.credential_id),
    verification_url: orNull(fields.verification_url),
    is_public: fields.is_public,
  };
}

/**
 * Cria a linha sem arquivo e devolve `id` e `userId` para o client montar o
 * caminho `{userId}/{id}.{ext}` e subir o arquivo direto pro Storage.
 */
export async function createCertificate(
  fields: CertificateFields,
): Promise<{ id: string; userId: string } | { error: CertActionError }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not_authenticated" };

  const invalid = validateInput(fields);
  if (invalid) return { error: { field: invalid.field, code: invalid.code } };

  const inserted = await supabase
    .from("certificates")
    .insert({ user_id: user.id, ...toRow(fields) })
    .select("id")
    .single();

  if (inserted.error || !inserted.data) return { error: "unknown" };

  revalidatePath("/certificados");
  return { id: inserted.data.id, userId: user.id };
}

/** Grava os metadados do arquivo depois que o upload direto terminou. */
export async function attachFile(
  id: string,
  file: FilePayload,
): Promise<{ ok: true } | { error: CertActionError }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not_authenticated" };

  const updated = await supabase
    .from("certificates")
    .update({
      file_path: file.path,
      file_mime: file.mime,
      file_size_bytes: file.size,
    })
    .eq("id", id)
    .select("id");

  if (updated.error) return { error: "unknown" };
  if (updated.data?.length !== 1) return { error: "not_found" };

  revalidatePath("/certificados");
  return { ok: true };
}

export async function updateCertificate(
  id: string,
  fields: CertificateFields,
): Promise<{ ok: true } | { error: CertActionError }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not_authenticated" };

  const invalid = validateInput(fields);
  if (invalid) return { error: { field: invalid.field, code: invalid.code } };

  const updated = await supabase
    .from("certificates")
    .update(toRow(fields))
    .eq("id", id)
    .select("id");

  if (updated.error) return { error: "unknown" };
  if (updated.data?.length !== 1) return { error: "not_found" };

  revalidatePath("/certificados");
  return { ok: true };
}

/**
 * Apaga o arquivo do Storage antes da linha. Se apagasse a linha primeiro,
 * perderia o `file_path` e o objeto viraria órfão consumindo cota.
 */
export async function deleteCertificate(
  id: string,
): Promise<{ ok: true } | { error: CertActionError }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not_authenticated" };

  const found = await supabase
    .from("certificates")
    .select("file_path")
    .eq("id", id)
    .maybeSingle();

  if (found.error) return { error: "unknown" };
  if (!found.data) return { error: "not_found" };

  if (found.data.file_path) {
    await supabase.storage.from("certificates").remove([found.data.file_path]);
  }

  const deleted = await supabase
    .from("certificates")
    .delete()
    .eq("id", id)
    .select("id");

  if (deleted.error || deleted.data?.length !== 1) return { error: "unknown" };

  revalidatePath("/certificados");
  return { ok: true };
}

/** Signed URL de curta duração (60 s), gerada no servidor, só para o dono. */
export async function getDownloadUrl(
  id: string,
): Promise<{ url: string } | { error: CertActionError }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not_authenticated" };

  const found = await supabase
    .from("certificates")
    .select("file_path")
    .eq("id", id)
    .maybeSingle();

  if (found.error) return { error: "unknown" };
  if (!found.data) return { error: "not_found" };
  if (!found.data.file_path) return { error: "no_file" };

  const signed = await supabase.storage
    .from("certificates")
    .createSignedUrl(found.data.file_path, 60);

  if (signed.error || !signed.data) return { error: "unknown" };
  return { url: signed.data.signedUrl };
}
