"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { isLocale, LOCALE_COOKIE, type Locale } from "@/i18n/config";

type ActionError = { error: "invalid_locale" };

/**
 * Troca de idioma é mutação: Server Action, nunca fetch para rota interna.
 * Erro volta como objeto tipado — nada de exceção crua na UI (CLAUDE.md).
 */
export async function setLocale(locale: Locale): Promise<ActionError | void> {
  if (!isLocale(locale)) return { error: "invalid_locale" };

  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
}
