import { createBrowserClient } from "@supabase/ssr";

import { supabaseAnonKey, supabaseUrl } from "@/lib/env";

import type { Database } from "./database.types";

/** Client do browser. Chave anon: quem protege a linha é a RLS, não este arquivo. */
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl(), supabaseAnonKey());
}
