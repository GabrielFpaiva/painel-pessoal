import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { CertificateCard } from "@/components/certificates/certificate-card";
import { EmptyState, ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

/** Lista enxuta da Fase 1.1. A grade com busca e tags entra na 1.3. */
export default async function CertificadosPage() {
  const t = await getTranslations("certificates");
  const tState = await getTranslations("state");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("certificates")
    .select("id, title, institution, issued_on, expires_on, workload_hours, file_path")
    .order("issued_on", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="display text-xl font-semibold">{t("title")}</h1>
        <Button size="sm" render={<Link href="/certificados/novo" />}>
          <Plus /> {t("new")}
        </Button>
      </div>

      {error ? (
        <ErrorState title={tState("errorTitle")} description={t("errors.unknown")} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title={t("empty.title")}
          description={t("empty.description")}
          action={
            <Button render={<Link href="/certificados/novo" />}>
              <Plus /> {t("empty.cta")}
            </Button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {data.map((certificate) => (
            <CertificateCard key={certificate.id} certificate={certificate} />
          ))}
        </ul>
      )}
    </div>
  );
}
