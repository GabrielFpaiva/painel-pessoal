import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Callback do OAuth: troca o code por sessão e devolve a pessoa para onde ela
 * queria ir. Sem perfil, o layout de `(app)` desvia para o resgate do convite —
 * aqui não decidimos isso, para ter um lugar só que responde "tem perfil?".
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("proxima") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?erro=sem_codigo`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?erro=falha_no_login`);
  }

  // Caminho relativo só: `proxima` vem da URL e não pode virar redirect aberto.
  const destination = next.startsWith("/") && !next.startsWith("//")
    ? next
    : "/dashboard";

  return NextResponse.redirect(`${origin}${destination}`);
}
