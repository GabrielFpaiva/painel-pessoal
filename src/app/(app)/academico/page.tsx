import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/states";

/** Casca da Fase 0. O conteúdo desta tela entra na Fase 2. */
export default async function AcademicoPage() {
  const t = await getTranslations();

  return (
    <div className="flex flex-col gap-5">
      <h1 className="display text-xl font-semibold">{t("nav.academico")}</h1>
      <EmptyState
        title={t("page.soonTitle")}
        description={t("page.soon", { phase: "2" })}
      />
    </div>
  );
}
