"use client";

import { Plus } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { allNav, primaryNav } from "@/lib/navigation";

/**
 * ⌘K navega **e** cria — as duas coisas, porque o produto é orientado a teclado
 * no desktop e abrir menu com o mouse para cadastrar um livro é lento.
 */
export function CommandPalette() {
  const t = useTranslations("palette");
  const tNav = useTranslations("nav");
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((previous) => !previous);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const go = useCallback(
    (href: Route) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  return (
    <>
      {/* No celular o mesmo painel abre pelo polegar; no desktop, pelo ⌘K. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("add")}
        className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom)+1rem)] right-4 z-50 flex size-14 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-one transition-transform active:scale-95 md:hidden"
      >
        <Plus className="size-6" />
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title={t("title")}
        description={t("description")}
      >
        {/* O `CommandDialog` do shadcn entrega os filhos direto ao conteúdo do
            diálogo, sem envolver em `Command` — sem este wrapper o cmdk fica
            sem contexto e quebra em runtime. */}
        <Command>
          <CommandInput placeholder={t("placeholder")} />
          <CommandList>
          <CommandEmpty>{t("empty")}</CommandEmpty>

          <CommandGroup heading={t("create")}>
            {primaryNav.map(({ key, newHref }) => (
              <CommandItem
                key={`novo-${key}`}
                value={`${t("new")} ${tNav(key)}`}
                onSelect={() => go(newHref)}
              >
                <Plus className="size-4" />
                {t("new")} {tNav(key)}
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandGroup heading={t("navigate")}>
            {allNav.map(({ key, href, icon: Icon }) => (
              <CommandItem key={key} value={tNav(key)} onSelect={() => go(href)}>
                <Icon className="size-4" />
                {tNav(key)}
              </CommandItem>
            ))}
          </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
