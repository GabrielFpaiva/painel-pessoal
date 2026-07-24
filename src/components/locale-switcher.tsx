"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { setLocale } from "@/i18n/actions";
import { locales, type Locale } from "@/i18n/config";

/**
 * Dois idiomas cabem em dois botões — select seria um clique a mais e um
 * componente a mais. Se um terceiro idioma entrar, isto vira menu.
 */
export function LocaleSwitcher() {
  const t = useTranslations("locale");
  const current = useLocale();
  const [pending, startTransition] = useTransition();

  return (
    <div
      className="inline-flex items-center gap-1"
      role="group"
      aria-label={t("label")}
    >
      {locales.map((locale: Locale) => {
        const active = locale === current;
        return (
          <Button
            key={locale}
            variant={active ? "secondary" : "ghost"}
            size="sm"
            className="h-11 px-3"
            aria-pressed={active}
            disabled={pending}
            onClick={() => startTransition(() => void setLocale(locale))}
          >
            {t(locale)}
          </Button>
        );
      })}
    </div>
  );
}
