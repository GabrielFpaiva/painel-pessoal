"use client";

import imageCompression from "browser-image-compression";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

import {
  attachFile,
  createCertificate,
  updateCertificate,
  type CertActionError,
  type CertificateFields,
} from "@/app/(app)/certificados/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  extForMime,
  validateFile,
  type CertificateMime,
} from "@/domain/certificates/file";
import { createClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

const BUCKET = "certificates";
const ACCEPT = "application/pdf,image/png,image/jpeg";

export type CertificateFormValues = {
  id?: string;
  /** Necessário para montar o caminho do upload ao editar. */
  userId?: string;
  title: string;
  institution: string | null;
  issued_on: string | null;
  expires_on: string | null;
  workload_hours: number | null;
  credential_id: string | null;
  verification_url: string | null;
  is_public: boolean;
  file_path: string | null;
  file_mime: string | null;
};

/** Erro do formulário: de campo (objeto), de arquivo, ou situacional (string). */
type FormError =
  | CertActionError
  | "file.mime"
  | "file.too_big"
  | "file_upload_failed";

type Phase = "idle" | "compressing" | "uploading" | "saving";

function messageKey(error: FormError): string {
  if (typeof error === "object") return `errors.${error.field}.${error.code}`;
  return `errors.${error}`;
}

/** `true` se o erro pertence a este campo, para acender o `aria-invalid`. */
function isFieldError(error: FormError | null, field: string): boolean {
  return error !== null && typeof error === "object" && error.field === field;
}

export function CertificateForm({ initial }: { initial: CertificateFormValues }) {
  const t = useTranslations("certificates");
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const isEdit = Boolean(initial.id);
  const [error, setError] = useState<FormError | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const busy = phase !== "idle";

  function readFields(form: HTMLFormElement): CertificateFields {
    const data = new FormData(form);
    const text = (name: string) => {
      const value = String(data.get(name) ?? "").trim();
      return value.length > 0 ? value : null;
    };
    const workloadRaw = text("workload_hours");
    return {
      title: String(data.get("title") ?? ""),
      institution: text("institution"),
      issued_on: text("issued_on"),
      expires_on: text("expires_on"),
      workload_hours: workloadRaw === null ? null : Number(workloadRaw),
      credential_id: text("credential_id"),
      verification_url: text("verification_url"),
      is_public: data.get("is_public") === "on",
    };
  }

  /** Comprime imagem (PDF passa direto), valida o tamanho final, sobe e grava. */
  async function uploadFile(userId: string, id: string, raw: File): Promise<boolean> {
    const mime = raw.type;
    if (validateFile({ mime, size: raw.size }) === "mime") {
      setError("file.mime");
      return false;
    }

    let file: File = raw;
    if (mime.startsWith("image/")) {
      setPhase("compressing");
      file = await imageCompression(raw, {
        maxSizeMB: 5,
        maxWidthOrHeight: 2000,
        useWebWorker: true,
      });
    }

    if (validateFile({ mime, size: file.size }) === "too_big") {
      setError("file.too_big");
      return false;
    }

    setPhase("uploading");
    const supabase = createClient();
    const path = `${userId}/${id}.${extForMime(mime as CertificateMime)}`;
    const upload = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true, contentType: mime });
    if (upload.error) return false;

    // Troca de extensão deixaria o arquivo antigo órfão — remove.
    if (initial.file_path && initial.file_path !== path) {
      await supabase.storage.from(BUCKET).remove([initial.file_path]);
    }

    const attached = await attachFile(id, { path, mime: mime as CertificateMime, size: file.size });
    return !("error" in attached);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError(null);

    const form = event.currentTarget;
    const fields = readFields(form);
    const file = (form.elements.namedItem("file") as HTMLInputElement).files?.[0];

    setPhase("saving");

    if (isEdit) {
      const result = await updateCertificate(initial.id!, fields);
      if ("error" in result) {
        setError(result.error);
        setPhase("idle");
        return;
      }
      if (file && initial.userId) {
        const ok = await uploadFile(initial.userId, initial.id!, file);
        if (!ok) {
          setError((prev) => prev ?? "file_upload_failed");
          setPhase("idle");
          return;
        }
      }
    } else {
      const created = await createCertificate(fields);
      if ("error" in created) {
        setError(created.error);
        setPhase("idle");
        return;
      }
      if (file) {
        const ok = await uploadFile(created.userId, created.id, file);
        if (!ok) {
          // O certificado ficou salvo sem arquivo; avisa e leva pra edição.
          setError((prev) => prev ?? "file_upload_failed");
          setPhase("idle");
          router.push(`/certificados/${created.id}/editar`);
          router.refresh();
          return;
        }
      }
    }

    router.push("/certificados");
    router.refresh();
  }

  const saveLabel =
    phase === "compressing"
      ? t("form.compressing")
      : phase === "uploading"
        ? t("form.uploading")
        : phase === "saving"
          ? t("form.saving")
          : t("form.save");

  return (
    <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">{t("form.titleLabel")}</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={initial.title}
          placeholder={t("form.titlePlaceholder")}
          aria-invalid={isFieldError(error, "title") || undefined}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="institution">{t("form.institutionLabel")}</Label>
        <Input id="institution" name="institution" defaultValue={initial.institution ?? ""} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="issued_on">{t("form.issuedOnLabel")}</Label>
          <Input
            id="issued_on"
            name="issued_on"
            type="date"
            className="tabular"
            defaultValue={initial.issued_on ?? ""}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="expires_on">{t("form.expiresOnLabel")}</Label>
          <Input
            id="expires_on"
            name="expires_on"
            type="date"
            className="tabular"
            defaultValue={initial.expires_on ?? ""}
            aria-invalid={isFieldError(error, "expires_on") || undefined}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="workload_hours">{t("form.workloadLabel")}</Label>
          <Input
            id="workload_hours"
            name="workload_hours"
            type="number"
            min={0}
            inputMode="numeric"
            className="tabular"
            defaultValue={initial.workload_hours ?? ""}
            aria-invalid={isFieldError(error, "workload_hours") || undefined}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="credential_id">{t("form.credentialLabel")}</Label>
          <Input
            id="credential_id"
            name="credential_id"
            className="tabular"
            defaultValue={initial.credential_id ?? ""}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="verification_url">{t("form.verificationUrlLabel")}</Label>
        <Input
          id="verification_url"
          name="verification_url"
          type="url"
          inputMode="url"
          placeholder="https://"
          defaultValue={initial.verification_url ?? ""}
          aria-invalid={isFieldError(error, "verification_url") || undefined}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="file">{t("form.fileLabel")}</Label>
        <Input id="file" name="file" type="file" accept={ACCEPT} />
        <p className="text-sm text-muted-foreground">
          {initial.file_path ? t("form.fileReplace") : t("form.fileHint")}
        </p>
      </div>

      <label className="flex items-center gap-3 rounded-lg border border-border p-3">
        <input
          type="checkbox"
          name="is_public"
          defaultChecked={initial.is_public}
          className="size-4 accent-primary"
        />
        <span className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{t("form.publicLabel")}</span>
          <span className="text-sm text-muted-foreground">{t("form.publicHint")}</span>
        </span>
      </label>

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {t(messageKey(error))}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" size="lg" className={cn("h-11 flex-1")} disabled={busy}>
          {saveLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-11"
          disabled={busy}
          onClick={() => router.push("/certificados")}
        >
          {t("form.cancel")}
        </Button>
      </div>
    </form>
  );
}
