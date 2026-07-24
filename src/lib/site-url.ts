import "server-only";

import { headers } from "next/headers";

/**
 * Origem do request, para montar o `redirectTo` do OAuth.
 *
 * Lê do header em vez de fixar em variável: a Vercel dá um domínio diferente
 * para cada preview, e um valor fixo mandaria o callback para o lugar errado.
 */
export async function siteOrigin(): Promise<string> {
  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host");
  if (!host) throw new Error("Request sem host: não dá para montar o callback.");

  const proto =
    list.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");

  return `${proto}://${host}`;
}
