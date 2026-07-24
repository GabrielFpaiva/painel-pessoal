import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { supabaseAnonKey, supabaseUrl } from "@/lib/env";

import type { Database } from "./database.types";

/**
 * Client de Server Component e Server Action. Continua sujeito à RLS — a
 * diferença para o browser é só de onde vem a sessão.
 */
export async function createClient() {
  const store = await cookies();

  return createServerClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            store.set(name, value, options);
          }
        } catch {
          // Server Component não pode escrever cookie. Quem renova a sessão é o
          // middleware; aqui o silêncio é o comportamento correto.
        }
      },
    },
  });
}
