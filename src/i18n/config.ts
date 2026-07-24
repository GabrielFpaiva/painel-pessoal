/**
 * Locale mora em cookie, não na URL (ver docs/superpowers/specs — D-01).
 * A lista aqui é a mesma do CHECK de `profiles.locale` no schema.
 */
export const locales = ["pt-BR", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "pt-BR";

/** Fuso default do produto (ADR-11). Sobrescrito por `profiles.timezone`. */
export const defaultTimeZone = "America/Fortaleza";

export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: string | undefined): value is Locale {
  return locales.includes(value as Locale);
}
