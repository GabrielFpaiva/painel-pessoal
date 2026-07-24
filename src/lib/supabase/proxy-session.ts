import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { supabaseAnonKey, supabaseUrl } from "@/lib/env";

/** Rotas que exigem sessão. `/u/{username}` e `(auth)` ficam de fora. */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/certificados",
  "/cursos",
  "/roadmap",
  "/missoes",
  "/livros",
  "/academico",
  "/github",
  "/config",
];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Renova a sessão e barra quem não tem uma.
 *
 * O cookie renovado precisa viajar na resposta **e** no request, senão o
 * Server Component logo adiante ainda lê o token velho.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // `getUser()` valida o token no servidor de auth. `getSession()` confiaria no
  // cookie, que o browser pode ter forjado.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && isProtected(pathname)) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    // Volta para onde a pessoa queria ir, depois de entrar.
    login.searchParams.set("proxima", pathname);
    return NextResponse.redirect(login);
  }

  if (user && pathname === "/login") {
    const dashboard = request.nextUrl.clone();
    dashboard.pathname = "/dashboard";
    dashboard.search = "";
    return NextResponse.redirect(dashboard);
  }

  return response;
}
