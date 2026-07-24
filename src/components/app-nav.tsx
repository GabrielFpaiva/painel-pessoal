"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { primaryNav, secondaryNav } from "@/lib/navigation";
import { cn } from "@/lib/utils";

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Barra inferior: quatro abas, alvo de 44px, respeitando a área segura do
 * iPhone. É a navegação primária no celular — no desktop ela some e vira
 * sidebar.
 */
export function BottomNav() {
  const t = useTranslations("nav");
  const isActive = useIsActive();

  return (
    <nav
      aria-label={t("label")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="flex">
        {primaryNav.map(({ key, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={key} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 text-xs transition-colors",
                  active
                    ? "text-academic"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-5" />
                {t(key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Mesma navegação no desktop, mais o que no celular sai do avatar. */
export function Sidebar() {
  const t = useTranslations("nav");
  const isActive = useIsActive();

  return (
    <aside className="hidden w-56 shrink-0 border-r border-border bg-surface md:block">
      <nav aria-label={t("label")} className="flex flex-col gap-6 p-3">
        <ul className="flex flex-col gap-0.5">
          {primaryNav.map(({ key, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={key}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-surface-2 text-academic"
                      : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {t(key)}
                </Link>
              </li>
            );
          })}
        </ul>

        <ul className="flex flex-col gap-0.5">
          {secondaryNav.map(({ key, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={key}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-surface-2 text-academic"
                      : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {t(key)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
