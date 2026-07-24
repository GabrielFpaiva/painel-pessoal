import { getTranslations } from "next-intl/server";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * Home provisória da Fase 0. Existe para provar a fundação: tokens, três
 * famílias tipográficas, troca de tema e troca de idioma. A tela de verdade
 * chega na 0.5.
 */
export default async function Home() {
  const t = await getTranslations("home");

  const sample = [
    { code: "GDSCO0001", label: "Cálculo Vetorial", value: "8,7" },
    { code: "GDSCO0042", label: "Estrutura de Dados", value: "9,1" },
    { code: "GDSCO0107", label: "Banco de Dados", value: "10,0" },
  ];

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-5 py-8">
      <header className="flex items-center justify-between gap-2">
        <h1 className="display text-2xl font-semibold">{t("title")}</h1>
        <div className="flex items-center gap-1">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <p className="max-w-prose text-balance text-muted-foreground">
        {t("intro")}
      </p>

      <section className="rounded-lg border border-border bg-card shadow-one">
        <h2 className="display border-b border-border px-4 py-3 text-sm font-semibold">
          {t("sampleLabel")}
        </h2>
        <ul>
          {sample.map((row) => (
            <li
              key={row.code}
              className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
            >
              <span className="tabular text-xs text-academic">{row.code}</span>
              <span className="min-w-0 flex-1 truncate text-sm">
                {row.label}
              </span>
              <span className="tabular text-sm text-progress">{row.value}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-sm text-muted-foreground">{t("sampleHint")}</p>
    </main>
  );
}
