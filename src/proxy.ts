import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy-session";

/**
 * O que o Next 15 chamava de `middleware` virou `proxy` no 16 — mesmo ponto do
 * ciclo do request, nome novo.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Tudo, menos arquivo estático e imagem — pedir sessão para um .svg custa
     * uma ida ao servidor de auth por asset, sem proteger nada.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
