import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import {
  CertificateForm,
  type CertificateFormValues,
} from "@/components/certificates/certificate-form";
import { createClient } from "@/lib/supabase/server";

export default async function EditarCertificadoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("certificates");
  const supabase = await createClient();

  const { data } = await supabase
    .from("certificates")
    .select(
      "id, user_id, title, institution, issued_on, expires_on, workload_hours, credential_id, verification_url, is_public, file_path, file_mime",
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  const initial: CertificateFormValues = {
    id: data.id,
    userId: data.user_id,
    title: data.title,
    institution: data.institution,
    issued_on: data.issued_on,
    expires_on: data.expires_on,
    workload_hours: data.workload_hours,
    credential_id: data.credential_id,
    verification_url: data.verification_url,
    is_public: data.is_public,
    file_path: data.file_path,
    file_mime: data.file_mime,
  };

  return (
    <div className="flex max-w-xl flex-col gap-5">
      <h1 className="display text-xl font-semibold">{t("form.editTitle")}</h1>
      <CertificateForm initial={initial} />
    </div>
  );
}
