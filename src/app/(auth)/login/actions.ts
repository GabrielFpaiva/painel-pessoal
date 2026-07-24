"use server";

import { createClient } from "@/lib/supabase/server";
import { siteOrigin } from "@/lib/site-url";

/**
 * Devolve a URL do GitHub em vez de redirecionar aqui: `redirect()` do Next só
 * aceita rota interna, e o destino do OAuth é outro domínio. Quem navega é o
 * formulário.
 */
export type LoginState =
  | { error: "oauth_failed" }
  | { url: string }
  | null;

/**
 * Único caminho de entrada: GitHub. Não existe cadastro por e-mail — quem entra
 * precisa de convite, e o convite é resgatado depois de autenticar.
 */
export async function signInWithGitHub(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const supabase = await createClient();
  const origin = await siteOrigin();

  const next = String(formData.get("proxima") ?? "/dashboard");
  const callback = new URL("/auth/callback", origin);
  callback.searchParams.set("proxima", next);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: { redirectTo: callback.toString() },
  });

  if (error || !data.url) return { error: "oauth_failed" };

  return { url: data.url };
}
