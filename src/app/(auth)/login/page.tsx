import { getTranslations } from "next-intl/server";

import { LoginForm } from "./login-form";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const t = await getTranslations("auth");
  const params = await searchParams;

  const raw = typeof params.proxima === "string" ? params.proxima : "/dashboard";
  // Nunca confie no parâmetro: caminho relativo só, senão vira redirect aberto.
  const proxima = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";

  const erro = typeof params.erro === "string" ? params.erro : null;

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="display text-2xl font-semibold">{t("loginTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("loginSubtitle")}</p>
      </div>

      <LoginForm proxima={proxima} />

      {erro ? (
        <p role="alert" className="text-sm text-danger">
          {erro === "sem_codigo"
            ? t("errors.sem_codigo")
            : t("errors.falha_no_login")}
        </p>
      ) : null}

      <p className="text-sm text-muted-foreground">{t("inviteOnly")}</p>
    </>
  );
}
