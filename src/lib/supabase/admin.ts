import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { supabaseUrl } from "@/lib/env";

import type { Database } from "./database.types";

/**
 * Client com service role: passa por cima da RLS.
 *
 * Existe por um motivo só — o resgate de convite precisa escrever `profiles` e
 * `invites` antes de o usuário ter perfil, e nenhuma policy pode permitir isso
 * (ADR-04). Qualquer outro uso é bug: se a operação é do dono, ela cabe no
 * client normal e a RLS aprova.
 *
 * `server-only` já quebra o build se isto for importado por um Client
 * Component; a checagem abaixo cobre o resto (import indireto em runtime).
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("createAdminClient() não pode rodar no browser.");
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "Variável de ambiente ausente: SUPABASE_SERVICE_ROLE_KEY. Copie .env.local.example para .env.local.",
    );
  }

  return createSupabaseClient<Database>(supabaseUrl(), serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
