import { getTranslations } from "next-intl/server";

import {
  CertificateForm,
  type CertificateFormValues,
} from "@/components/certificates/certificate-form";

const EMPTY: CertificateFormValues = {
  title: "",
  institution: null,
  issued_on: null,
  expires_on: null,
  workload_hours: null,
  credential_id: null,
  verification_url: null,
  is_public: false,
  file_path: null,
  file_mime: null,
};

export default async function NovoCertificadoPage() {
  const t = await getTranslations("certificates");
  return (
    <div className="flex max-w-xl flex-col gap-5">
      <h1 className="display text-xl font-semibold">{t("form.createTitle")}</h1>
      <CertificateForm initial={EMPTY} />
    </div>
  );
}
